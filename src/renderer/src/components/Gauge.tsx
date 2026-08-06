interface GaugeProps {
  label: string
  value: number // 0-100
  detail?: string
  size?: number
}

// A 270° sweep with a 90° gap at the bottom — the classic car-speedometer shape. Angles measured
// in the standard SVG convention (0° = 3 o'clock, clockwise as the angle increases).
const START_ANGLE = -225
const SWEEP = 270

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

/** Same status palette used everywhere else — green/amber/orange/red carry the same meaning here as on a risk pill. */
function colorForValue(value: number): string {
  if (value < 50) return 'var(--color-status-good)'
  if (value < 75) return 'var(--color-status-warning)'
  if (value < 90) return 'var(--color-status-serious)'
  return 'var(--color-status-critical)'
}

export default function Gauge({ label, value, detail, size = 168 }: GaugeProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 16
  const arcPath = describeArc(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP)
  const arcLength = r * ((SWEEP * Math.PI) / 180)
  const color = colorForValue(clamped)

  // Minor tick marks at 0/25/50/75/100% around the sweep — decorative, matches a real dashboard dial.
  const ticks = [0, 25, 50, 75, 100].map((pct) => {
    const angle = START_ANGLE + (pct / 100) * SWEEP
    const outer = polarToCartesian(cx, cy, r + 9, angle)
    const inner = polarToCartesian(cx, cy, r + 3, angle)
    return { pct, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y }
  })

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ticks.map((t) => (
          <line
            key={t.pct}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} strokeLinecap="round" />
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 500ms ease, stroke 400ms ease' }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="Bebas Neue, sans-serif" fontSize={size * 0.24} fill="white">
          {Math.round(clamped)}
        </text>
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" fontSize={size * 0.08} fill="rgba(255,255,255,0.4)">
          %
        </text>
      </svg>
      <p className="ft-heading -mt-2 text-sm text-white/70">{label}</p>
      {detail && <p className="text-xs text-white/40">{detail}</p>}
    </div>
  )
}
