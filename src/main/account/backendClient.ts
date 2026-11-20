import type {
  AppPurchasablePlan,
  FreeScanSubmission,
  FreeScanSubmissionResult,
  RequestCodeResult,
  TicketPlan,
  TicketStatus
} from '../../shared/ipc-types'

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

// Sentinel message the renderer matches on — Electron's IPC only carries an error's message across,
// not its class, so this string is the contract between here and useAccount.tsx.
export const SESSION_EXPIRED = 'SESSION_EXPIRED'

export class SessionExpiredError extends Error {
  constructor() {
    super(SESSION_EXPIRED)
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })
  // A 401 on a request that carried a token means the server no longer accepts the saved login
  // (expired, or the server's signing secret changed) — not that it's unreachable. Login endpoints
  // send no token, so their own 401s ("wrong password") keep their normal message below.
  if (res.status === 401 && new Headers(options.headers).has('Authorization')) {
    throw new SessionExpiredError()
  }
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

export function googleLogin(idToken: string): Promise<AuthResult> {
  return apiFetch('/auth/customer/google', { method: 'POST', body: JSON.stringify({ id_token: idToken }) })
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
export async function createCheckoutSession(
  email: string,
  plan: AppPurchasablePlan,
  referralCode?: string
): Promise<string> {
  const res = await fetch(`${WEBSITE_API_BASE}/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // create-checkout.js validates this against the backend itself and silently drops it if
    // invalid — nothing here needs to pre-validate, same as the website's Pricing page.
    body: JSON.stringify({
      service: plan,
      email,
      ...(referralCode?.trim() ? { referral_code: referralCode.trim() } : {})
    })
  })
  if (!res.ok) throw new Error(`Checkout request failed (${res.status})`)
  const data = (await res.json()) as { url?: string; error?: string }
  if (!data.url) throw new Error(data.error ?? 'Checkout did not return a payment URL')
  return data.url
}

/**
 * No auth — a free scan visitor has no account yet (see CLAUDE-free-scan.md hard rule: works with
 * no account and no internet for the local portion, this part is the optional online extra). Same
 * FastAPI backend, a new public endpoint (rate-limited by IP server-side, same as every other
 * unauthenticated endpoint there).
 */
export function submitFreeScanResults(payload: FreeScanSubmission): Promise<FreeScanSubmissionResult> {
  return apiFetch('/free-scan/results', { method: 'POST', body: JSON.stringify(payload) })
}
