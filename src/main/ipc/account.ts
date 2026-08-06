import { ipcMain } from 'electron'
import * as backend from '../account/backendClient'
import type { RawTicket, RawUser } from '../account/backendClient'
import { loadSession, saveSession } from '../account/sessionStore'
import type { AccountSession, AccountTicket, AccountUser, TicketPlan } from '../../shared/ipc-types'

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
}
