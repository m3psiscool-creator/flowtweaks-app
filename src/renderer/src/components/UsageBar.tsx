interface UsageBarProps {
  label: string
  percent: number
  detail?: string
}

export default function UsageBar({ label, percent, detail }: UsageBarProps): React.JSX.Element {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-ft-white">
          {clamped.toFixed(0)}%{detail ? <span className="ml-2 text-white/40">{detail}</span> : null}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-ft-orange transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
