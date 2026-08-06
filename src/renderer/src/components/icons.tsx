// Small, hand-drawn line-icon set — deliberately minimal (24x24, stroke-based, currentColor) so
// every icon recolors with a text-color class and stays visually consistent with the rest of the
// brand instead of pulling in a mismatched external icon library.
type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function IconCpu({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  )
}

export function IconGpu({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="6" width="19" height="11" rx="1.5" />
      <circle cx="8" cy="11.5" r="2.2" />
      <path d="M13 9.5h5M13 13.5h5M6 17v2M11 17v2" />
    </svg>
  )
}

export function IconMemory({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <path d="M6 8V5M9 8V5M12 8V5M15 8V5M18 8V5M6 16v3M18 16v3" />
    </svg>
  )
}

export function IconStorage({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  )
}

export function IconComputer({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  )
}

export function IconWindows({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <path d="M3 6.5 11 5.3V11.5H3zM12 5.15 21 3.8V11.5H12zM3 12.5H11V18.7L3 17.5zM12 12.5H21V20.2L12 18.85z" />
    </svg>
  )
}

export function IconShield({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function IconBolt({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

export function IconNetwork({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M12 11 6.5 17M12 11l5.5 6" />
    </svg>
  )
}

export function IconClock({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

export function IconCheckCircle({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5.5" />
    </svg>
  )
}

export function IconAlertTriangle({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <path d="M12 4 21.5 20H2.5z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconXCircle({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  )
}

export function IconGamepad({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="8" width="19" height="9" rx="4.5" />
      <path d="M7 10.5v4M5 12.5h4" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSparkle({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  )
}

export function IconUser({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </svg>
  )
}

export function IconRocket({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <path d="M12 2c3 2 4.5 6 4.5 10 0 2-.5 4-1.5 5.5l-3-2-3 2C7.5 16 7 14 7 12c0-4 1.5-8 5-10z" />
      <circle cx="12" cy="10" r="1.4" />
      <path d="M9 15.5l-2.5 1.3.3 2.7M15 15.5l2.5 1.3-.3 2.7" />
    </svg>
  )
}

export function IconInfo({ className }: IconProps): React.JSX.Element {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
