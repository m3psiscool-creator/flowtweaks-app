import type { RegistrySnapshotValue } from '../../shared/ipc-types'
import { loadSessions, saveSessions } from './store'
import { captureSnapshots } from './snapshot'

function registryValuesEqual(a: string | number | null, b: string | number | null): boolean {
  if (typeof a === 'number' || typeof b === 'number') {
    const normalize = (n: number): number => (n < 0 ? n + 4294967296 : n)
    return normalize(Number(a)) === normalize(Number(b))
  }
  return String(a) === String(b)
}

/**
 * Resolves every 'pending' change log entry to its true outcome by re-reading the live system
 * state — this is what keeps the log accurate after a crash, regardless of exactly when the app
 * died: before the write (current value still matches the old previousValue → 'failed',
 * interrupted before it happened), after the write (current value matches what was being applied
 * → 'applied', it really did complete), or in some other unexpected state → 'failed', flagged for
 * manual review rather than guessed at. Runs once at startup, before the UI can touch anything.
 */
export async function reconcilePendingEntries(): Promise<void> {
  const sessions = await loadSessions()
  const pending = sessions.flatMap((session) =>
    session.entries.filter((e) => e.outcome === 'pending').map((entry) => ({ session, entry }))
  )
  if (pending.length === 0) return

  const registryPending = pending.filter(({ entry }) => entry.operation.type === 'registry')
  const requests = registryPending.map(({ entry }) => ({
    key: entry.id,
    operation: entry.operation
  }))
  const currentValues = await captureSnapshots(requests)

  for (const { entry } of pending) {
    if (entry.operation.type !== 'registry' || entry.previousValue.kind !== 'registry') {
      // Only registry apply is implemented this phase — any other pending entry is unexpected.
      entry.outcome = 'failed'
      entry.errorMessage =
        'Interrupted mid-change and could not be automatically verified — check this setting manually.'
      continue
    }

    const current = currentValues[entry.id]
    const desired = entry.operation.desiredValue
    const previous = entry.previousValue as RegistrySnapshotValue

    if (!current || current.kind !== 'registry') {
      entry.outcome = 'failed'
      entry.errorMessage = 'Interrupted mid-change and could not re-read the current value — check this setting manually.'
      continue
    }

    if (current.present && registryValuesEqual(current.raw, desired)) {
      // The write completed before the app died — the change log was just never told.
      entry.outcome = 'applied'
      entry.errorMessage = undefined
    } else if (current.present === previous.present && registryValuesEqual(current.raw, previous.raw)) {
      // Unchanged from before the write was attempted — it never happened.
      entry.outcome = 'failed'
      entry.errorMessage = 'Interrupted before this change was applied (Flow Tweaks closed unexpectedly).'
    } else {
      // Neither the old nor the new value — something else touched it. Don't guess.
      entry.outcome = 'failed'
      entry.errorMessage =
        'Interrupted mid-change and left in an unexpected state — check this setting manually.'
    }
  }

  await saveSessions(sessions)
}
