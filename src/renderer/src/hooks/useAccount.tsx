import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AccountSession, AccountTicket, AppPurchasablePlan, TicketPlan } from '@shared/ipc-types'

// A ticket for pc or both means the desktop app itself is unlocked — console-only tickets are
// real purchases, just not ones this Windows app can do anything with (see AppPurchasablePlan).
function hasAppLicense(tickets: AccountTicket[]): boolean {
  return tickets.some((t) => t.plan === 'pc' || t.plan === 'both')
}

// The backend (Render free tier) spins down after inactivity and can take 50+ seconds to wake —
// without a retry, the very first ticket fetch after any period of idleness fails, hasLicense
// silently reads as false, and an already-paying customer sees the buy screen as if signed out.
// These delays span roughly that whole wake-up window before giving up for real.
const TICKET_RETRY_DELAYS_MS = [5000, 10000, 15000, 20000]

// Must match SESSION_EXPIRED in src/main/account/backendClient.ts (main-process code can't be
// imported into the renderer, and IPC only carries the message string across).
const SESSION_EXPIRED = 'SESSION_EXPIRED'
const SESSION_EXPIRED_NOTICE = 'Your sign-in expired. Please sign in again — your purchases are safe.'

interface UseAccountResult {
  session: AccountSession | null
  loading: boolean
  tickets: AccountTicket[]
  loadingTickets: boolean
  ticketsError: string | null
  hasLicense: boolean
  error: string | null
  busy: boolean
  requestCode: (email: string) => Promise<boolean>
  verifyCode: (email: string, code: string) => Promise<boolean>
  googleLogin: () => Promise<boolean>
  staffLogin: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshTickets: () => void
  buyPlan: (plan: AppPurchasablePlan, referralCode?: string) => Promise<boolean>
  redeemCode: (code: string) => Promise<{ ok: boolean; plan?: TicketPlan }>
}

// Plain hooks re-run their state independently per call site — with six different pages each
// calling this, that meant six independent session/ticket fetches (and, once retries were added,
// six independently-timed retry sequences) that could genuinely disagree with each other: Billing
// could show "unlocked" from its own successful fetch while the sidebar, mid-retry on its own
// separate fetch, still showed "locked". AccountProvider below runs this exactly once and shares
// the result via context so every consumer sees the same state at the same time.
function useAccountState(): UseAccountResult {
  const [session, setSession] = useState<AccountSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<AccountTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadTickets = useCallback(async (role: 'customer' | 'staff') => {
    setLoadingTickets(true)
    setTicketsError(null)
    const fetcher = role === 'staff' ? window.api.account.getStaffTickets : window.api.account.getMyTickets
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await fetcher()
        setTickets(result)
        setTicketsError(null)
        break
      } catch (err) {
        // The server rejected our saved login. Retrying can't fix that — the main process has
        // already cleared the stored session, so drop back to the sign-in screen right away.
        if (err instanceof Error && err.message.includes(SESSION_EXPIRED)) {
          setSession(null)
          setTickets([])
          setError(SESSION_EXPIRED_NOTICE)
          break
        }
        if (attempt >= TICKET_RETRY_DELAYS_MS.length) {
          // Retries exhausted — a real failure, not just a cold start. Leave `tickets` as it was
          // (don't clobber a last-known-good license state with an empty list) and surface the
          // error so the UI can show "couldn't check" instead of confidently declaring "unlicensed."
          setTicketsError(err instanceof Error ? err.message : String(err))
          break
        }
        await new Promise((resolve) => setTimeout(resolve, TICKET_RETRY_DELAYS_MS[attempt]))
      }
    }
    setLoadingTickets(false)
  }, [])

  useEffect(() => {
    window.api.account
      .getSession()
      .then((s) => {
        setSession(s)
        if (s) loadTickets(s.user.role)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requestCode = useCallback(async (email: string) => {
    setError(null)
    setBusy(true)
    try {
      await window.api.account.requestCode(email)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      setError(null)
      setBusy(true)
      try {
        const s = await window.api.account.verifyCode(email, code)
        setSession(s)
        loadTickets(s.user.role)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return false
      } finally {
        setBusy(false)
      }
    },
    [loadTickets]
  )

  const googleLogin = useCallback(async () => {
    setError(null)
    setBusy(true)
    try {
      const s = await window.api.account.googleLogin()
      setSession(s)
      loadTickets(s.user.role)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
    } finally {
      setBusy(false)
    }
  }, [loadTickets])

  const staffLogin = useCallback(
    async (username: string, password: string) => {
      setError(null)
      setBusy(true)
      try {
        const s = await window.api.account.staffLogin(username, password)
        setSession(s)
        loadTickets(s.user.role)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return false
      } finally {
        setBusy(false)
      }
    },
    [loadTickets]
  )

  const logout = useCallback(async () => {
    await window.api.account.logout()
    setSession(null)
    setTickets([])
  }, [])

  const refreshTickets = useCallback(() => {
    if (session) loadTickets(session.user.role)
  }, [session, loadTickets])

  const buyPlan = useCallback(
    async (plan: AppPurchasablePlan, referralCode?: string) => {
      setError(null)
      setBusy(true)
      try {
        const result = await window.api.account.buyPlan(plan, referralCode)
        if (!result.ok) {
          setError(result.error ?? 'Could not start checkout.')
          return false
        }
        return true
      } finally {
        setBusy(false)
      }
    },
    []
  )

  const redeemCode = useCallback(
    async (code: string) => {
      setError(null)
      setBusy(true)
      try {
        const result = await window.api.account.redeemCode(code)
        if (!result.ok) {
          if (result.error === SESSION_EXPIRED) {
            setSession(null)
            setTickets([])
            setError(SESSION_EXPIRED_NOTICE)
            return { ok: false }
          }
          setError(result.error ?? 'Invalid or already-used code.')
          return { ok: false }
        }
        refreshTickets()
        return { ok: true, plan: result.ticket?.plan }
      } finally {
        setBusy(false)
      }
    },
    [refreshTickets]
  )

  return {
    session,
    loading,
    tickets,
    loadingTickets,
    ticketsError,
    hasLicense: hasAppLicense(tickets),
    error,
    busy,
    requestCode,
    verifyCode,
    googleLogin,
    staffLogin,
    logout,
    refreshTickets,
    buyPlan,
    redeemCode
  }
}

const AccountContext = createContext<UseAccountResult | null>(null)

export function AccountProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const value = useAccountState()
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount(): UseAccountResult {
  const ctx = useContext(AccountContext)
  if (!ctx) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return ctx
}
