import type { AppPurchasablePlan, RequestCodeResult, TicketPlan, TicketStatus } from '../../shared/ipc-types'

// The existing website/staff-dashboard backend — CLAUDE.md is explicit that Account must
// authenticate against this, not a second invented backend or user database.
const API_BASE = 'https://flowtweaks-backend.onrender.com/api'

// The website's own Vercel serverless functions — same create-checkout endpoint the website's
// Pricing page already calls for console, just invoked from the app for pc/both instead.
const WEBSITE_API_BASE = 'https://flowtweaks.com/api'

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

export function redeemAccessCode(token: string, code: string): Promise<RawTicket> {
  return apiFetch('/redeem-code', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code })
  })
}

/**
 * Calls the website's own Stripe checkout endpoint (not the FastAPI backend) — reused as-is, just
 * invoked from here instead of from the Pricing page's Pay button. Passing the verified email
 * locks Stripe's checkout email field to it, so the payment always matches the account the
 * webhook will attach the resulting ticket to.
 */
export async function createCheckoutSession(email: string, plan: AppPurchasablePlan): Promise<string> {
  const res = await fetch(`${WEBSITE_API_BASE}/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: plan, email })
  })
  if (!res.ok) throw new Error(`Checkout request failed (${res.status})`)
  const data = (await res.json()) as { url?: string; error?: string }
  if (!data.url) throw new Error(data.error ?? 'Checkout did not return a payment URL')
  return data.url
}
