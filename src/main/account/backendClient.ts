import type { RequestCodeResult, TicketPlan, TicketStatus } from '../../shared/ipc-types'

// The existing website/staff-dashboard backend — CLAUDE.md is explicit that Account must
// authenticate against this, not a second invented backend or user database.
const API_BASE = 'https://flowtweaks-backend.onrender.com/api'

export interface RawUser {
  id: string
  email?: string
  name?: string | null
  username?: string
  role: 'customer' | 'staff'
}

export interface RawTicket {
  id: string
  plan: TicketPlan
  plan_label: string
  price: number
  status: TicketStatus
  created_at: string
}

interface AuthResult {
  token: string
  user: RawUser
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: string }
      detail = body.detail ?? detail
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export function requestCustomerCode(email: string, plan?: TicketPlan): Promise<RequestCodeResult> {
  return apiFetch('/auth/customer/request', { method: 'POST', body: JSON.stringify({ email, plan }) })
}

export function verifyCustomerCode(email: string, code: string): Promise<AuthResult> {
  return apiFetch('/auth/customer/verify', { method: 'POST', body: JSON.stringify({ email, code }) })
}

export function staffLogin(username: string, password: string): Promise<AuthResult> {
  return apiFetch('/auth/staff/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export function getMyTickets(token: string): Promise<RawTicket[]> {
  return apiFetch('/tickets/mine', { headers: { Authorization: `Bearer ${token}` } })
}

export function getStaffTickets(token: string): Promise<RawTicket[]> {
  return apiFetch('/tickets?scope=all', { headers: { Authorization: `Bearer ${token}` } })
}
