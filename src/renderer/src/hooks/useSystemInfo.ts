import { useEffect, useState } from 'react'
import type { SystemSpecs, SystemUsage } from '@shared/ipc-types'

interface UseSystemInfoResult {
  specs: SystemSpecs | null
  usage: SystemUsage | null
  error: string | null
}

export function useSystemInfo(): UseSystemInfoResult {
  const [specs, setSpecs] = useState<SystemSpecs | null>(null)
  const [usage, setUsage] = useState<SystemUsage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    window.api.system
      .getSpecs()
      .then((result) => {
        if (!cancelled) setSpecs(result)
      })
      .catch(() => {
        if (!cancelled) setError('Could not read system specs.')
      })

    const unsubscribe = window.api.system.onUsage((result) => {
      if (!cancelled) setUsage(result)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { specs, usage, error }
}
