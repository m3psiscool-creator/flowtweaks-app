interface PillProps {
  label: string
  className: string
}

export default function Pill({ label, className }: PillProps): React.JSX.Element {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>
  )
}
