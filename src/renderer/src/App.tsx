import { useState } from 'react'
import Sidebar from '@renderer/components/Sidebar'
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
  const ActivePage = PAGES[active] ?? Home

  return (
    <div className="flex h-screen flex-col bg-ft-black text-ft-white">
      {/* Matches the 32px titleBarOverlay reserved in main/index.ts — the only way the window
          becomes draggable, since titleBarStyle:'hidden' doesn't add that on its own. */}
      <div className="ft-titlebar h-8 w-full shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onSelect={setActive} />
        <main className="flex-1 overflow-y-auto p-8">
          <ActivePage />
        </main>
      </div>
    </div>
  )
}
