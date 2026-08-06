import { useCallback, useEffect, useState } from 'react'
import type { AccountSession, AccountTicket, AppPurchasablePlan } from '@shared/ipc-types'

// A ticket for pc or both means the desktop app itself is unlocked — console-only tickets are
// real purchases, just not ones this Windows app can do anything with (see AppPurchasablePlan).
function hasAppLicense(tickets: AccountTicket[]): boolean {
  return tickets.some((t) => t.plan === 'pc' || t.plan === 'both')
}

interface UseAccountResult {
  session: AccountSession | null
  loading: boolean
  tickets: AccountTicket[]
  loadingTickets: boolean
  hasLicense: boolean
  error: string | null
  busy: boolean
  requestCode: (email: string) => Promise<boolean>
  verifyCode: (email: string, code: string) => Promise<boolean>
  staffLogin: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshTickets: () => void
  buyPlan: (plan: AppPurchasablePlan) => Promise<boolean>
  redeemCode: (code: string) => Promise<boolean>
}

export function useAccount(): UseAccountResult {
  const [session, setSession] = useState<AccountSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<AccountTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadTickets = useCallback((role: 'customer' | 'staff') => {
    setLoadingTickets(true)
    const fetcher = role === 'staff' ? window.api.account.getStaffTickets : window.api.account.getMyTickets
    fetcher()
      .then(setTickets)
      .finally(() => setLoadingTickets(false))
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
    async (plan: AppPurchasablePlan) => {
      setError(null)
      setBusy(true)
      try {
        const result = await window.api.account.buyPlan(plan)
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
          setError(result.error ?? 'Invalid or already-used code.')
          return false
        }
        refreshTickets()
        return true
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
    hasLicense: hasAppLicense(tickets),
    error,
    busy,
    requestCode,
    verifyCode,
    staffLogin,
    logout,
    refreshTickets,
    buyPlan,
    redeemCode
  }
}
