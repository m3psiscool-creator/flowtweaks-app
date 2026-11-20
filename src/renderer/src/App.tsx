import { useEffect, useState } from 'react'
import Sidebar, { UNLICENSED_ALLOWED_KEYS } from '@renderer/components/Sidebar'
import { AppNavigationProvider } from '@renderer/context/AppNavigation'
import { useAccount } from '@renderer/hooks/useAccount'
import TrialClock from '@renderer/components/TrialClock'
import Home from '@renderer/pages/Home'
import Optimizations from '@renderer/pages/Optimizations'
import FreeScan from '@renderer/pages/FreeScan'
import GameProfiles from '@renderer/pages/GameProfiles'
import StartupPrograms from '@renderer/pages/StartupPrograms'
import Restore from '@renderer/pages/Restore'
import Diagnostics from '@renderer/pages/Diagnostics'
import Account from '@renderer/pages/Account'
import Billing from '@renderer/pages/Billing'
import About from '@renderer/pages/About'

const PAGES: Record<string, () => React.JSX.Element> = {
  home: Home,
  optimizations: Optimizations,
  'free-scan': FreeScan,
  'game-profiles': GameProfiles,
  'startup-programs': StartupPrograms,
  restore: Restore,
  diagnostics: Diagnostics,
  account: Account,
  billing: Billing,
  about: About
}

export default function App(): React.JSX.Element {
  const [active, setActive] = useState('home')
  const { session, hasLicense, trial, startTrial, startRequested, setStartRequested, loading: accountLoading, loadingTickets } =
    useAccount()
  // While we don't yet know (session still loading, or the ticket fetch is mid-retry after a
  // cold Render backend) we neither grant nor revoke access — see useAccount's retry loop. Only
  // a completed check (success or exhausted retries) is allowed to change what's shown; a slow
  // backend must never look the same as an unlicensed account.
  const stillChecking = accountLoading || (!!session && loadingTickets)
  const isFullAccess = session?.user.role === 'staff' || (!!session && hasLicense)
  const ActivePage = PAGES[active] ?? Optimizations

  // Everyone lands on Home, which carries the big Start Tweaks button. Unlicensed accounts can
  // only reach the tabs in UNLICENSED_ALLOWED_KEYS; anything else bounces them to Free Scan.
  useEffect(() => {
    if (stillChecking) return
    if (!isFullAccess && !UNLICENSED_ALLOWED_KEYS.has(active)) {
      setActive('free-scan')
    }
  }, [stillChecking, isFullAccess, active])

  // Home's Start Tweaks button, pressed while signed out: the visitor went off to create an
  // account. Once that's done and the account check has finished, finish the job for them — start
  // the free trial (only possible with an account) and open Optimizations.
  useEffect(() => {
    if (!startRequested || stillChecking || !session) return
    setStartRequested(false)
    if (session.user.role === 'staff' || hasLicense) {
      setActive('optimizations')
    } else if (trial?.state === 'none' && !trial.hasPaid) {
      startTrial().then((ok) => setActive(ok ? 'optimizations' : 'billing'))
    } else {
      setActive('billing')
    }
  }, [startRequested, stillChecking, session, hasLicense, trial, startTrial, setStartRequested])

  return (
    <div className="flex h-screen flex-col bg-ft-black text-ft-white">
      {/* Matches the 32px titleBarOverlay reserved in main/index.ts — the only way the window
          becomes draggable, since titleBarStyle:'hidden' doesn't add that on its own. */}
      <div className="ft-titlebar h-8 w-full shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onSelect={setActive} restricted={!stillChecking && !isFullAccess} />
        <main className="flex-1 overflow-y-auto p-8">
          {trial?.state === 'active' && !trial.hasPaid && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded border border-ft-orange/40 bg-ft-orange/10 px-4 py-2.5 text-sm">
              <span className="text-white/80">
                Free trial ends in{' '}
                <strong className="text-ft-orange">
                  <TrialClock remainingMs={trial.remainingMs} />
                </strong>
                . Your tweaks are removed when it ends.
              </span>
              <button
                type="button"
                onClick={() => setActive('billing')}
                className="ft-heading shrink-0 text-ft-orange hover:underline"
              >
                Buy to keep them →
              </button>
            </div>
          )}
          <AppNavigationProvider value={setActive}>
            <ActivePage />
          </AppNavigationProvider>
        </main>
      </div>
    </div>
  )
}
