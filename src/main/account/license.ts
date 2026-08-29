import { loadSession } from './sessionStore'
import { getMyTickets } from './backendClient'

// Mirrors useAccount.tsx's hasAppLicense (renderer) — duplicated intentionally rather than shared,
// since this is the one that actually matters: it runs in the main process, ahead of tweaks:apply
// and tweaks:disable, so a customer can't unlock tweaks just by skipping the renderer's UI gate
// and invoking the IPC channel directly.
export async function hasValidLicense(): Promise<boolean> {
  const session = await loadSession()
  if (!session) return false
  if (session.user.role === 'staff') return true

  try {
    const tickets = await getMyTickets(session.token)
    return tickets.some((t) => t.plan === 'pc' || t.plan === 'both')
  } catch {
    // Backend unreachable or token invalid — fail closed, not open.
    return false
  }
}
