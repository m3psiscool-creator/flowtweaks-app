import { ipcMain, shell } from 'electron'
import * as backend from '../account/backendClient'
import type { RawTicket, RawUser } from '../account/backendClient'
import { loadSession, saveSession } from '../account/sessionStore'
import type {
  AccountSession,
  AccountTicket,
  AccountUser,
  AppPurchasablePlan,
  CheckoutResult,
  RedeemCodeResult,
  TicketPlan
} from '../../shared/ipc-types'

function mapUser(raw: RawUser): AccountUser {
  return { id: raw.id, email: raw.email, name: raw.name ?? null, username: raw.username, role: raw.role }
}

function mapTicket(raw: RawTicket): AccountTicket {
  return {
    id: raw.id,
    plan: raw.plan,
    planLabel: raw.plan_label,
    price: raw.price,
    status: raw.status,
    createdAt: raw.created_at
  }
}

export function registerAccountIpcHandlers(): void {
  ipcMain.handle('account:getSession', () => loadSession())

  ipcMain.handle('account:requestCode', (_event, email: string, plan?: TicketPlan) =>
    backend.requestCustomerCode(email, plan)
  )

  ipcMain.handle('account:verifyCode', async (_event, email: string, code: string) => {
    const result = await backend.verifyCustomerCode(email, code)
    const session: AccountSession = { token: result.token, user: mapUser(result.user) }
    await saveSession(session)
    return session
  })

  ipcMain.handle('account:staffLogin', async (_event, username: string, password: string) => {
    const result = await backend.staffLogin(username, password)
    const session: AccountSession = { token: result.token, user: mapUser(result.user) }
    await saveSession(session)
    return session
  })

  ipcMain.handle('account:logout', () => saveSession(null))

  ipcMain.handle('account:getMyTickets', async (): Promise<AccountTicket[]> => {
    const session = await loadSession()
    if (!session || session.user.role !== 'customer') return []
    const raw = await backend.getMyTickets(session.token)
    return raw.map(mapTicket)
  })

  ipcMain.handle('account:getStaffTickets', async (): Promise<AccountTicket[]> => {
    const session = await loadSession()
    if (!session || session.user.role !== 'staff') return []
    const raw = await backend.getStaffTickets(session.token)
    return raw.map(mapTicket)
  })

  // Opens the Stripe checkout in the system browser rather than returning the URL to the
  // renderer — Electron renderers can't (and shouldn't) navigate to arbitrary external payment
  // pages themselves. The customer completes payment there; the webhook creates their ticket
  // server-side, and they come back to the app and hit Refresh (or just reopen Account).
  ipcMain.handle(
    'account:buyPlan',
    async (_event, plan: AppPurchasablePlan, referralCode?: string): Promise<CheckoutResult> => {
      const session = await loadSession()
      if (!session || session.user.role !== 'customer' || !session.user.email) {
        return { ok: false, error: 'Sign in first.' }
      }
      try {
        const url = await backend.createCheckoutSession(session.user.email, plan, referralCode)
        await shell.openExternal(url)
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle('account:redeemCode', async (_event, code: string): Promise<RedeemCodeResult> => {
    const session = await loadSession()
    if (!session || session.user.role !== 'customer') {
      return { ok: false, error: 'Sign in first.' }
    }
    try {
      const raw = await backend.redeemAccessCode(session.token, code)
      return { ok: true, ticket: mapTicket(raw) }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
