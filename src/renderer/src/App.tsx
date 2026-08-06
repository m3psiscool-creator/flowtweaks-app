import { useState } from 'react'
import Sidebar from '@renderer/components/Sidebar'
import Home from '@renderer/pages/Home'
import Optimizations from '@renderer/pages/Optimizations'
import FpsEstimator from '@renderer/pages/FpsEstimator'
import GameProfiles from '@renderer/pages/GameProfiles'
import Restore from '@renderer/pages/Restore'
import Diagnostics from '@renderer/pages/Diagnostics'
import Account from '@renderer/pages/Account'
import About from '@renderer/pages/About'

// BoostMode.tsx still exists and works — it's just not routed here. See Sidebar.tsx's NAV_ITEMS
// comment for why it was cut from the UI.
const PAGES: Record<string, () => React.JSX.Element> = {
  home: Home,
  optimizations: Optimizations,
  'fps-estimator': FpsEstimator,
  'game-profiles': GameProfiles,
  restore: Restore,
  diagnostics: Diagnostics,
  account: Account,
  about: About
}

export default function App(): React.JSX.Element {
  const [active, setActive] = useState('home')
  const ActivePage = PAGES[active] ?? Home

  return (
    <div className="flex h-screen bg-ft-black text-ft-white">
      <Sidebar active={active} onSelect={setActive} />
      <main className="flex-1 overflow-y-auto p-8">
        <ActivePage />
      </main>
    </div>
  )
}
