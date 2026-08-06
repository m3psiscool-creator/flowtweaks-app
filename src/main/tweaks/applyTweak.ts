import type { Operation, TweakDefinition } from '../../../data/schema'
import type { SnapshotValue, SystemSpecs, TweakApplyResult } from '../../shared/ipc-types'
import { evaluateCompatibility } from './compatibility'
import { applyOperation } from './applyOperation'
import { captureSnapshots } from '../restore/snapshot'
import { appendPendingEntry, updateEntryOutcome } from '../restore/changeLog'
import { applyDnsCloudflareTweak } from './dns/applyDnsTweak'
import { withResolvedAmdTweak } from './gpu/amdRegistry'

function snapshotMatchesDesired(operation: Operation, snapshot: SnapshotValue | null): boolean {
  if (!snapshot || operation.type !== 'registry' || snapshot.kind !== 'registry') return false
  if (!snapshot.present) return false

  if (operation.valueType === 'REG_DWORD') {
    const normalize = (n: number): number => (n < 0 ? n + 4294967296 : n)
    return normalize(Number(snapshot.raw)) === normalize(Number(operation.desiredValue))
  }
  if (operation.valueType === 'REG_BINARY') {
    return String(snapshot.raw).toUpperCase() === String(operation.desiredValue).toUpperCase()
  }
  return String(snapshot.raw) === String(operation.desiredValue)
}

/**
 * Validates, snapshots, applies, and logs one tweak. Every hard rule from CLAUDE.md's "Restore
 * and history" section applies here: check before applying, snapshot before changing, log every
 * change and every failure.
 */
export async function applyTweak(
  inputTweak: TweakDefinition,
  specs: SystemSpecs,
  isElevated: boolean,
  sessionId: string,
  enabledTweakIds: Set<string>,
  allowDnsOverride: boolean
): Promise<TweakApplyResult> {
  // Network tweaks have their own pipeline (adapter selection, dynamic compatibility, connectivity
  // verification with auto-revert) — they don't go through the generic registry-write loop at all.
  if (inputTweak.apply.some((op) => op.type === 'networkDns')) {
    return applyDnsCloudflareTweak(inputTweak, sessionId, allowDnsOverride)
  }

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
          : `Applying "${unsupportedOp.type}" changes isn't built yet — this tweak can't be applied by the app.`
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
    snapshotMatchesDesired(op, snapshots[`${tweak.id}__${i}`] ?? null)
  )
  if (alreadyMatches) {
    return { tweakId: tweak.id, outcome: 'already-enabled' }
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
        'Could not read the current value before applying — skipped for safety.'
      )
      continue
    }

    // Written to disk BEFORE the write is attempted — see appendPendingEntry's doc comment.
    const entry = await appendPendingEntry(sessionId, tweak.id, i, operation, snapshot)
    const result = await applyOperation(operation)
    if (result.success) {
      await updateEntryOutcome(sessionId, entry.id, 'applied')
    } else {
      anyFailed = true
      await updateEntryOutcome(sessionId, entry.id, 'failed', result.error)
    }
  }

  return anyFailed
    ? { tweakId: tweak.id, outcome: 'failed', detail: 'One or more changes failed — check the change log.' }
    : { tweakId: tweak.id, outcome: 'applied' }
}
