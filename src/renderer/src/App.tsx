import { useEffect, useState } from 'react'
import Sidebar, { UNLICENSED_ALLOWED_KEYS } from '@renderer/components/Sidebar'
import { AppNavigationProvider } from '@renderer/context/AppNavigation'
import { useAccount } from '@renderer/hooks/useAccount'
import Home from '@renderer/pages/Home'
import Optimizations from '@renderer/pages/Optimizations'
import FpsEstimator from '@renderer/pages/FpsEstimator'
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
  'fps-estimator': FpsEstimator,
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
  const { session, hasLicense, loading: accountLoading } = useAccount()
  // Fails closed: while account status is still loading, treat as restricted rather than
  // briefly showing the full nav and yanking it away a moment later. Staff bypass entirely,
  // same rule as the "can this account actually apply tweaks" check on Optimizations itself.
  const isFullAccess = !accountLoading && (session?.user.role === 'staff' || (!!session && hasLicense))
  const ActivePage = PAGES[active] ?? Optimizations

  // Licensed/staff accounts land on Home as always. Unlicensed accounts start there too (the
  // default state above), but this immediately bounces them to Optimizations — the one paid
  // page they're still allowed to see, deliberately blurred/locked (see Optimizations.tsx) so
  // the first thing they see is exactly what they're missing, not a dead end.
  useEffect(() => {
    if (!isFullAccess && !UNLICENSED_ALLOWED_KEYS.has(active)) {
      setActive('optimizations')
    }
  }, [isFullAccess, active])

  return (
    <div className="flex h-screen flex-col bg-ft-black text-ft-white">
      {/* Matches the 32px titleBarOverlay reserved in main/index.ts — the only way the window
          becomes draggable, since titleBarStyle:'hidden' doesn't add that on its own. */}
      <div className="ft-titlebar h-8 w-full shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onSelect={setActive} restricted={!isFullAccess} />
        <main className="flex-1 overflow-y-auto p-8">
          <AppNavigationProvider value={setActive}>
            <ActivePage />
          </AppNavigationProvider>
        </main>
      </div>
    </div>
  )
}
