import {
  IconComputer,
  IconBolt,
  IconGamepad,
  IconClock,
  IconShield,
  IconUser,
  IconInfo,
  IconRocket,
  IconCreditCard,
  IconSparkle
} from '@renderer/components/icons'

export interface NavItem {
  key: string
  label: string
  icon: (props: { className?: string }) => React.JSX.Element
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: IconComputer },
  { key: 'optimizations', label: 'Optimizations', icon: IconBolt },
  { key: 'free-scan', label: 'Free Scan', icon: IconSparkle },
  { key: 'game-profiles', label: 'Game Profiles', icon: IconGamepad },
  { key: 'startup-programs', label: 'Startup Programs', icon: IconRocket },
  { key: 'restore', label: 'Restore', icon: IconClock },
  { key: 'diagnostics', label: 'Diagnostics', icon: IconShield },
  { key: 'account', label: 'Account', icon: IconUser },
  { key: 'billing', label: 'Billing', icon: IconCreditCard },
  { key: 'about', label: 'About', icon: IconInfo }
]

// Everything an unlicensed account can reach: the two tabs that get them to a purchase
// (Free Scan as the free taste — a real measured baseline plus locked tweaks, not just a guess —
// and Billing to actually pay), Optimizations itself (shown blurred/locked — see
// Optimizations.tsx — so they can see exactly what they're missing), and Account, kept only
// because it's where sign-in lives; there's nowhere else for that to happen.
export const UNLICENSED_ALLOWED_KEYS = new Set(['free-scan', 'billing', 'optimizations', 'account'])

interface SidebarProps {
  active: string
  onSelect: (key: string) => void
  restricted: boolean
}

export default function Sidebar({ active, onSelect, restricted }: SidebarProps): React.JSX.Element {
  const items = restricted ? NAV_ITEMS.filter((item) => UNLICENSED_ALLOWED_KEYS.has(item.key)) : NAV_ITEMS
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-black/40 p-4">
      <div className="ft-heading mb-8 text-2xl text-ft-white">
        FLOW <span className="text-ft-orange">TWEAKS</span>
      </div>
      {restricted && (
        <p className="mb-4 rounded border border-ft-orange/30 bg-ft-orange/5 px-2.5 py-2 text-[11px] leading-snug text-ft-orange/80">
          Locked — unlock a plan in Billing to access the rest of the app.
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              className={`ft-heading flex w-full items-center gap-2.5 rounded border-l-2 px-3 py-2 text-left text-lg tracking-wide transition-all duration-150 ${
                active === item.key
                  ? 'border-ft-orange bg-ft-orange text-ft-black shadow-[0_0_16px_-4px_rgba(255,85,0,0.8)]'
                  : 'border-transparent text-white/70 hover:translate-x-0.5 hover:border-ft-orange/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
