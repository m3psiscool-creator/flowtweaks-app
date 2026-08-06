import type { Operation } from '../../../data/schema'
import type { StartupItem, StartupToggleResult } from '../../shared/ipc-types'
import { createRestorePoint } from '../restore/restorePoint'
import { createSession, appendPendingEntry, updateEntryOutcome } from '../restore/changeLog'
import { captureSnapshots } from '../restore/snapshot'
import { applyOperation } from '../tweaks/applyOperation'
import { disableOperation } from '../tweaks/disableOperation'
import {
  STARTUP_APPROVED_DISABLED_HEX,
  STARTUP_APPROVED_ENABLED_HEX,
  approvedHiveFor,
  approvedSubKeyFor
} from './startupApproved'

function buildOperation(item: Pick<StartupItem, 'scope' | 'source' | 'name'>): Operation {
  return {
    type: 'registry',
    hive: approvedHiveFor(item.scope),
    path: approvedSubKeyFor(item.source),
    valueName: item.name,
    valueType: 'REG_BINARY',
    desiredValue: STARTUP_APPROVED_ENABLED_HEX,
    disabledValue: STARTUP_APPROVED_DISABLED_HEX
  }
}

/**
 * Restore point first, always — same hard rule as every other real system change (CLAUDE.md).
 * Reuses the exact snapshot/apply/change-log pipeline tweaks use (captureSnapshots, applyOperation/
 * disableOperation, the change log), via a plain Operation built on the fly instead of one pulled
 * from a static TweakDefinition — a startup item's registry location isn't known until Scan
 * enumerates this specific machine's actual startup entries, so it can't live in a data file.
 */
export async function toggleStartupItem(
  item: Pick<StartupItem, 'id' | 'name' | 'scope' | 'source'>,
  enabled: boolean
): Promise<StartupToggleResult> {
  const restorePointResult = await createRestorePoint('Flow Tweaks — before changing a startup program')
  if (!restorePointResult.success) {
    return { success: false, restorePointCreated: false, restorePointError: restorePointResult.error }
  }

  const session = await createSession(`Startup program ${enabled ? 'enabled' : 'disabled'}: ${item.name}`, true)
  const operation = buildOperation(item)
  // Restore.tsx falls back to showing the raw tweakId when it isn't a real catalog tweak (which
  // this never is — a startup item's registry location is only known once Scan enumerates this
  // specific machine) — keep it human-readable rather than the more collision-proof full item.id.
  const tweakId = `Startup: ${item.name}`

  const snapshots = await captureSnapshots([{ key: `${tweakId}__0`, operation }])
  const snapshot = snapshots[`${tweakId}__0`]

  if (!snapshot) {
    const entry = await appendPendingEntry(session.id, tweakId, 0, operation, {
      kind: 'registry',
      present: false,
      raw: null
    })
    await updateEntryOutcome(
      session.id,
      entry.id,
      'failed',
      'Could not read the current value before applying — skipped for safety.'
    )
    return { success: false, restorePointCreated: true, error: 'Could not read the current startup state before changing it.' }
  }

  const entry = await appendPendingEntry(session.id, tweakId, 0, operation, snapshot)
  const result = enabled ? await applyOperation(operation) : await disableOperation(operation)

  if (result.success) {
    await updateEntryOutcome(session.id, entry.id, 'applied')
    return { success: true, restorePointCreated: true }
  }

  await updateEntryOutcome(session.id, entry.id, 'failed', result.error)
  return { success: false, restorePointCreated: true, error: result.error }
}
