import type { Operation, TweakDefinition } from '../../../data/schema'
import type { SnapshotValue, SystemSpecs, TweakDisableResult } from '../../shared/ipc-types'
import { evaluateCompatibility } from './compatibility'
import { disableOperation } from './disableOperation'
import { captureSnapshots } from '../restore/snapshot'
import { appendPendingEntry, updateEntryOutcome } from '../restore/changeLog'
import { withResolvedAmdTweak } from './gpu/amdRegistry'

function snapshotMatchesDisabled(operation: Operation, snapshot: SnapshotValue | null): boolean {
  if (!snapshot || operation.type !== 'registry' || snapshot.kind !== 'registry') return false
  if (!snapshot.present) return false

  if (operation.valueType === 'REG_DWORD') {
    const normalize = (n: number): number => (n < 0 ? n + 4294967296 : n)
    return normalize(Number(snapshot.raw)) === normalize(Number(operation.disabledValue))
  }
  if (operation.valueType === 'REG_BINARY') {
    return String(snapshot.raw).toUpperCase() === String(operation.disabledValue).toUpperCase()
  }
  return String(snapshot.raw) === String(operation.disabledValue)
}

/**
 * Mirrors applyTweak.ts but writes each operation's disabledValue instead of desiredValue. This is
 * what lets a tweak Scan found "Already Enabled" — never touched by Flow Tweaks, so no change-log
 * entry exists to revert from — be turned off directly. Same hard rules apply as apply: check
 * compatibility, snapshot the real current value before writing, log every change and every
 * failure. The snapshot taken here becomes a normal 'applied' change-log entry, so a customer who
 * disables a tweak can still revert THAT action later — the log doesn't care which direction a
 * write went, only what was there immediately before it.
 */
export async function disableTweak(
  inputTweak: TweakDefinition,
  specs: SystemSpecs,
  isElevated: boolean,
  sessionId: string,
  enabledTweakIds: Set<string>
): Promise<TweakDisableResult> {
  // AMD tweaks have no static registry path — resolved to a concrete 'registry' operation here,
  // once, before anything below ever looks at tweak.apply/detect.
  const tweak = await withResolvedAmdTweak(inputTweak)

  const unsupportedOp = tweak.apply.find((op) => op.type !== 'registry')
  if (unsupportedOp) {
    return {
      tweakId: tweak.id,
      outcome: 'needs-manual-review',
      detail:
        unsupportedOp.type === 'amdDriverRegistry'
          ? "Couldn't locate this PC's AMD GPU driver settings in the registry — try again as administrator."
          : `Disabling "${unsupportedOp.type}" changes isn't built yet — this tweak can't be turned off by the app.`
    }
  }

  const compat = evaluateCompatibility(tweak.compatibility, specs, enabledTweakIds)
  if (!compat.compatible) {
    return { tweakId: tweak.id, outcome: 'skipped-incompatible', detail: compat.reason }
  }

  if (tweak.requiresAdmin && !isElevated) {
    return {
      tweakId: tweak.id,
      outcome: 'needs-manual-review',
      detail: 'Requires administrator privileges — relaunch Flow Tweaks as admin.'
    }
  }

  const requests = tweak.apply.map((operation, index) => ({ key: `${tweak.id}__${index}`, operation }))
  const snapshots = await captureSnapshots(requests)

  const alreadyMatches = tweak.apply.every((op, i) =>
    snapshotMatchesDisabled(op, snapshots[`${tweak.id}__${i}`] ?? null)
  )
  if (alreadyMatches) {
    return { tweakId: tweak.id, outcome: 'already-disabled' }
  }

  let anyFailed = false
  for (let i = 0; i < tweak.apply.length; i++) {
    const operation = tweak.apply[i]
    const key = `${tweak.id}__${i}`
    const snapshot = snapshots[key]

    if (!snapshot) {
      anyFailed = true
      const entry = await appendPendingEntry(sessionId, tweak.id, i, operation, {
        kind: 'registry',
        present: false,
        raw: null
      })
      await updateEntryOutcome(
        sessionId,
        entry.id,
        'failed',
        'Could not read the current value before disabling — skipped for safety.'
      )
      continue
    }

    // Written to disk BEFORE the write is attempted — see appendPendingEntry's doc comment.
    const entry = await appendPendingEntry(sessionId, tweak.id, i, operation, snapshot)
    const result = await disableOperation(operation)
    if (result.success) {
      await updateEntryOutcome(sessionId, entry.id, 'applied')
    } else {
      anyFailed = true
      await updateEntryOutcome(sessionId, entry.id, 'failed', result.error)
    }
  }

  return anyFailed
    ? { tweakId: tweak.id, outcome: 'failed', detail: 'One or more changes failed — check the change log.' }
    : { tweakId: tweak.id, outcome: 'disabled' }
}
