import { loadSession } from '../account/sessionStore'
import { getMyTickets, getTrialStatus, SessionExpiredError } from '../account/backendClient'
import type { RawTrialStatus } from '../account/backendClient'
import type { TrialInfo } from '../../shared/ipc-types'
import { loadTrialState, saveTrialState } from './trialStore'
import { registerTrialTask, removeTrialTask } from './scheduledTask'

export function toTrialInfo(raw: RawTrialStatus): TrialInfo {
  const endsMs = raw.ends_at ? Date.parse(raw.ends_at) : 0
  const nowMs = Date.parse(raw.server_now)
  return {
    state: raw.state,
    endsAt: raw.ends_at,
    remainingMs: raw.state === 'active' ? Math.max(0, endsMs - nowMs) : 0,
    hasPaid: raw.has_paid
  }
}

export interface AccessResult {
  licensed: boolean
  source: 'staff' | 'paid' | 'trial' | 'none' | 'unknown'
  trial: TrialInfo | null
}

async function markPaid(customerId: string): Promise<void> {
  const prev = await loadTrialState()
  if (prev?.kind === 'paid' && prev.customerId === customerId) return
  await saveTrialState({ kind: 'paid', customerId })
  await removeTrialTask()
}

/**
 * The one place that decides whether tweaks may be applied. Everything is decided by the SERVER's
 * clock and records (a PC clock change can't extend a trial). Fails closed: if the backend can't
 * be reached, nothing is unlocked — and nothing is reverted either (see enforce.ts).
 *
 * Also keeps trial-state.json in step with what the server said, so the scheduled task and the
 * uninstaller know whether this customer is a paying one.
 */
export async function resolveAccess(): Promise<AccessResult> {
  const session = await loadSession()
  if (!session) return { licensed: false, source: 'none', trial: null }
  if (session.user.role === 'staff') return { licensed: true, source: 'staff', trial: null }

  let raw: RawTrialStatus | null = null
  try {
    raw = await getTrialStatus(session.token)
  } catch (err) {
    if (err instanceof SessionExpiredError) return { licensed: false, source: 'none', trial: null }
    // Older backend without the trial endpoints, or a hiccup: fall through to the ticket check.
  }

  if (raw) {
    const trial = toTrialInfo(raw)
    if (raw.has_paid) {
      await markPaid(session.user.id)
      return { licensed: true, source: 'paid', trial }
    }
    if (raw.state === 'active') {
      await saveTrialState({ kind: 'trial', customerId: session.user.id, token: session.token, endsAt: raw.ends_at })
      void registerTrialTask(Date.parse(raw.ends_at as string))
      return { licensed: true, source: 'trial', trial }
    }
    if (raw.state === 'expired') {
      const prev = await loadTrialState()
      // Never downgrade 'expired' (already reverted) back to 'trial'. If this PC has no record
      // (e.g. app reinstalled mid-trial), record it as 'trial' so the enforcer reverts anything
      // that is still applied.
      if (!prev || prev.customerId !== session.user.id) {
        await saveTrialState({
          kind: 'trial',
          customerId: session.user.id,
          token: session.token,
          endsAt: raw.ends_at
        })
      }
    }
    return { licensed: false, source: 'none', trial }
  }

  try {
    const tickets = await getMyTickets(session.token)
    if (tickets.some((t) => t.plan === 'pc' || t.plan === 'both')) {
      await markPaid(session.user.id)
      return { licensed: true, source: 'paid', trial: null }
    }
    return { licensed: false, source: 'none', trial: null }
  } catch {
    return { licensed: false, source: 'unknown', trial: null }
  }
}
