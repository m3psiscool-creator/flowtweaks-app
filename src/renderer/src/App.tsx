import { useState } from 'react'
import Sidebar from '@renderer/components/Sidebar'
import Home from '@renderer/pages/Home'
import Scan from '@renderer/pages/Scan'
import Optimizations from '@renderer/pages/Optimizations'
import GameProfiles from '@renderer/pages/GameProfiles'
import BoostMode from '@renderer/pages/BoostMode'
import Restore from '@renderer/pages/Restore'
import Diagnostics from '@renderer/pages/Diagnostics'
import Account from '@renderer/pages/Account'

const PAGES: Record<string, () => React.JSX.Element> = {
  home: Home,
  scan: Scan,
  optimizations: Optimizations,
  'game-profiles': GameProfiles,
  'boost-mode': BoostMode,
  restore: Restore,
  diagnostics: Diagnostics,
  account: Account
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
