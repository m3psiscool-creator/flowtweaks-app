import { randomUUID } from 'crypto'
import type { Operation } from '../../../data/schema'
import type {
  ChangeLogEntry,
  ChangeOutcome,
  RestoreSession,
  RevertResult,
  SnapshotValue
} from '../../shared/ipc-types'
import { loadSessions, saveSessions } from './store'
import { revertOperation } from './revert'

export async function createSession(
  description: string,
  restorePointCreated: boolean
): Promise<RestoreSession> {
  const sessions = await loadSessions()
  const session: RestoreSession = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    description,
    restorePointCreated,
    entries: []
  }
  sessions.unshift(session)
  await saveSessions(sessions)
  return session
}

export async function getSessions(): Promise<RestoreSession[]> {
  return loadSessions()
}

/**
 * Writes the entry as 'pending' BEFORE the system change is attempted — this is what makes the
 * log crash-safe. If the app dies between this call and updateEntryOutcome, the previous value
 * is already durable on disk, and reconcilePendingEntries() resolves it to the truth on next
 * startup instead of the log silently missing a change that actually happened.
 */
export async function appendPendingEntry(
  sessionId: string,
  tweakId: string,
  operationIndex: number,
  operation: Operation,
  previousValue: SnapshotValue
): Promise<ChangeLogEntry> {
  const sessions = await loadSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) throw new Error(`Unknown restore session: ${sessionId}`)

  const entry: ChangeLogEntry = {
    id: randomUUID(),
    tweakId,
    operationIndex,
    operation,
    previousValue,
    outcome: 'pending',
    timestamp: new Date().toISOString()
  }
  session.entries.push(entry)
  await saveSessions(sessions)
  return entry
}

export async function updateEntryOutcome(
  sessionId: string,
  entryId: string,
  outcome: ChangeOutcome,
  errorMessage?: string
): Promise<void> {
  const sessions = await loadSessions()
  const session = sessions.find((s) => s.id === sessionId)
  const entry = session?.entries.find((e) => e.id === entryId)
  if (!entry) throw new Error(`Unknown change log entry: ${entryId} in session ${sessionId}`)

  entry.outcome = outcome
  entry.errorMessage = errorMessage
  await saveSessions(sessions)
}

export async function revertEntry(entryId: string): Promise<RevertResult> {
  const sessions = await loadSessions()
  for (const session of sessions) {
    const entry = session.entries.find((e) => e.id === entryId)
    if (!entry) continue
    if (entry.outcome === 'reverted') return { success: true }

    const result = await revertOperation(entry.operation, entry.previousValue)
    entry.outcome = result.success ? 'reverted' : 'revert-failed'
    entry.errorMessage = result.error
    await saveSessions(sessions)
    return result
  }
  return { success: false, error: `Unknown change log entry: ${entryId}` }
}

async function revertEntries(sessions: RestoreSession[], entries: ChangeLogEntry[]): Promise<RevertResult> {
  let anyFailed = false

  for (const entry of entries) {
    const result = await revertOperation(entry.operation, entry.previousValue)
    entry.outcome = result.success ? 'reverted' : 'revert-failed'
    entry.errorMessage = result.error
    if (!result.success) anyFailed = true
  }

  await saveSessions(sessions)
  return anyFailed
    ? { success: false, error: 'One or more changes failed to revert. Check the change log for details.' }
    : { success: true }
}

/** Full rollback for one session: reverts every applied entry, most-recent-first. */
export async function revertSession(sessionId: string): Promise<RevertResult> {
  const sessions = await loadSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return { success: false, error: `Unknown restore session: ${sessionId}` }

  const toRevert = [...session.entries].reverse().filter((e) => e.outcome === 'applied')
  return revertEntries(sessions, toRevert)
}

/** Reverts one tweak's changes within a session — a tweak can span several logged entries (one per registry value it touched). */
export async function revertTweakInSession(sessionId: string, tweakId: string): Promise<RevertResult> {
  const sessions = await loadSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return { success: false, error: `Unknown restore session: ${sessionId}` }

  const toRevert = [...session.entries]
    .reverse()
    .filter((e) => e.tweakId === tweakId && e.outcome === 'applied')
  if (toRevert.length === 0) {
    return { success: false, error: `No applied changes found for "${tweakId}" in this session.` }
  }

  return revertEntries(sessions, toRevert)
}
