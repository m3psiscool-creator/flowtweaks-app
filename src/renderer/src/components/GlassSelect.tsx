import { useEffect, useRef, useState } from 'react'

export interface GlassSelectOption {
  value: string
  label: string
}

interface GlassSelectProps {
  value: string
  onChange: (value: string) => void
  options: GlassSelectOption[]
}

/**
 * Native <select> popups render with the OS's own listbox styling in Chromium/Electron —
 * regardless of CSS on the closed control, the open dropdown shows up as a plain white/system box
 * that can't be reskinned. This is a fully custom implementation so both the closed and open
 * states actually match the app.
 */
export default function GlassSelect({ value, onChange, options }: GlassSelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[200px] items-center justify-between gap-3 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white transition-colors hover:border-ft-orange/40"
      >
        {current?.label ?? 'Select…'}
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="ft-glass-solid absolute left-0 top-full z-20 mt-1.5 max-h-72 w-full min-w-[220px] overflow-y-auto p-1.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                opt.value === value ? 'bg-ft-orange/15 text-ft-orange' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
