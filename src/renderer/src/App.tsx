import { useEffect, useState } from 'react'
import Sidebar, { UNLICENSED_ALLOWED_KEYS } from '@renderer/components/Sidebar'
import { AppNavigationProvider } from '@renderer/context/AppNavigation'
import { useAccount } from '@renderer/hooks/useAccount'
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
  const { session, hasLicense, loading: accountLoading, loadingTickets } = useAccount()
  // While we don't yet know (session still loading, or the ticket fetch is mid-retry after a
  // cold Render backend) we neither grant nor revoke access — see useAccount's retry loop. Only
  // a completed check (success or exhausted retries) is allowed to change what's shown; a slow
  // backend must never look the same as an unlicensed account.
  const stillChecking = accountLoading || (!!session && loadingTickets)
  const isFullAccess = session?.user.role === 'staff' || (!!session && hasLicense)
  const ActivePage = PAGES[active] ?? Optimizations

  // Licensed/staff accounts land on Home as always. Unlicensed accounts start there too (the
  // default state above), but this immediately bounces them to Optimizations — the one paid
  // page they're still allowed to see, deliberately blurred/locked (see Optimizations.tsx) so
  // the first thing they see is exactly what they're missing, not a dead end.
  useEffect(() => {
    if (stillChecking) return
    if (!isFullAccess && !UNLICENSED_ALLOWED_KEYS.has(active)) {
      setActive('optimizations')
    }
  }, [stillChecking, isFullAccess, active])

  return (
    <div className="flex h-screen flex-col bg-ft-black text-ft-white">
      {/* Matches the 32px titleBarOverlay reserved in main/index.ts — the only way the window
          becomes draggable, since titleBarStyle:'hidden' doesn't add that on its own. */}
      <div className="ft-titlebar h-8 w-full shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onSelect={setActive} restricted={!stillChecking && !isFullAccess} />
        <main className="flex-1 overflow-y-auto p-8">
          <AppNavigationProvider value={setActive}>
            <ActivePage />
          </AppNavigationProvider>
        </main>
      </div>
    </div>
  )
}
