import { getMyTickets, getTrialStatus } from '../account/backendClient'
import { revertAllSessions } from '../restore/changeLog'
import { loadTrialState, saveTrialState, withEnforceLock } from './trialStore'
import { removeTrialTask } from './scheduledTask'

export type EnforceOutcome =
  | 'nothing-to-do'
  | 'still-active'
  | 'paid'
  | 'reverted'
  | 'revert-failed'
  | 'offline'
  | 'busy'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])
}

/**
 * If a free trial has ended and the customer hasn't bought, put this PC back the way it was: every
 * change Flow Tweaks logged is reverted (same revert the Restore page uses).
 *
 * Safety rules — a paying customer must never lose their tweaks to a glitch:
 *  - nothing is reverted unless the SERVER positively says the trial is expired AND no pc/both
 *    purchase exists. An unreachable backend, a cold Render start, or an error means "try again
 *    later", never "revert".
 *  - the server's clock decides, not this PC's.
 *  - runs under a lock so the app and the scheduled task can't revert at the same time.
 */
export async function enforceTrialExpiry(): Promise<EnforceOutcome> {
  const state = await loadTrialState()
  if (!state || state.kind !== 'trial' || !state.token) {
    if (state?.kind !== 'trial') await removeTrialTask()
    return 'nothing-to-do'
  }
  const token = state.token

  const result = await withEnforceLock(async (): Promise<EnforceOutcome> => {
    let status
    try {
      status = await withTimeout(getTrialStatus(token), 60_000)
    } catch {
      return 'offline'
    }

    if (status.has_paid) {
      await saveTrialState({ kind: 'paid', customerId: state.customerId })
      await removeTrialTask()
      return 'paid'
    }
    if (status.state === 'active') {
      await saveTrialState({ ...state, endsAt: status.ends_at })
      return 'still-active'
    }
    if (status.state !== 'expired') return 'nothing-to-do'

    const reverted = await revertAllSessions()
    if (!reverted.success) {
      console.error('Trial expiry revert incomplete:', reverted.error)
      return 'revert-failed' // stays 'trial' so the next run retries whatever is left
    }
    await saveTrialState({ kind: 'expired', customerId: state.customerId, token, endsAt: status.ends_at })
    await removeTrialTask()
    return 'reverted'
  })
  return result ?? 'busy'
}

/**
 * Run by the uninstaller (--uninstall-revert). Someone on a trial (or whose trial already ended)
 * who uninstalls gets their PC put back too, so removing the app can't be a way to keep the
 * tweaks for free. A paying customer's tweaks are left alone — and if there is no record of a
 * trial on this PC, nothing is touched.
 */
export async function revertOnUninstall(): Promise<void> {
  const state = await loadTrialState()
  await removeTrialTask()
  if (!state || state.kind === 'paid') return

  // The trial record may be stale — they might have bought since. Ask the server if we can.
  if (state.token) {
    try {
      const tickets = await withTimeout(getMyTickets(state.token), 10_000)
      if (tickets.some((t) => t.plan === 'pc' || t.plan === 'both')) {
        await saveTrialState({ kind: 'paid', customerId: state.customerId })
        return
      }
    } catch {
      // Offline: the local record says trial/expired, so treat them as unpaid.
    }
  }

  await withEnforceLock(async () => {
    const reverted = await revertAllSessions()
    if (!reverted.success) console.error('Uninstall revert incomplete:', reverted.error)
  })
}
