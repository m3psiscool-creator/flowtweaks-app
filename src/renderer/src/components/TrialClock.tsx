import { useEffect, useRef, useState } from 'react'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Live countdown. `remainingMs` is the SERVER's remaining time at the moment it was fetched; the
 * clock counts down from there with this PC's timer, so changing the PC's date can't change what
 * it shows. Re-syncs whenever a fresh value arrives.
 */
export default function TrialClock({
  remainingMs,
  className = ''
}: {
  remainingMs: number
  className?: string
}): React.JSX.Element {
  const syncedAt = useRef(Date.now())
  const [, setTick] = useState(0)

  useEffect(() => {
    syncedAt.current = Date.now()
    setTick((t) => t + 1)
  }, [remainingMs])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const left = Math.max(0, remainingMs - (Date.now() - syncedAt.current))
  const totalSeconds = Math.floor(left / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}
