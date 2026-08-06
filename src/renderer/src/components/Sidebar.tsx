export interface NavItem {
  key: string
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home' },
  { key: 'optimizations', label: 'Optimizations' },
  { key: 'fps-estimator', label: 'FPS Estimator' },
  { key: 'game-profiles', label: 'Game Profiles' },
  { key: 'boost-mode', label: 'Boost Mode' },
  { key: 'restore', label: 'Restore' },
  { key: 'diagnostics', label: 'Diagnostics' },
  { key: 'account', label: 'Account' },
  { key: 'about', label: 'About' }
]

interface SidebarProps {
  active: string
  onSelect: (key: string) => void
}

export default function Sidebar({ active, onSelect }: SidebarProps): React.JSX.Element {
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-black/40 p-4">
      <div className="ft-heading mb-8 text-2xl text-ft-white">
        FLOW <span className="text-ft-orange">TWEAKS</span>
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              className={`ft-heading w-full rounded px-3 py-2 text-left text-lg tracking-wide transition-colors ${
                active === item.key
                  ? 'bg-ft-orange text-ft-black'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
