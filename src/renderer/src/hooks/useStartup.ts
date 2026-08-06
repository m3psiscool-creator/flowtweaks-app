import { useCallback, useState } from 'react'
import type { StartupItem, StartupReport } from '@shared/ipc-types'

interface UseStartupResult {
  report: StartupReport | null
  loading: boolean
  error: string | null
  refresh: () => void
  togglingId: string | null
  toggleError: string | null
  setEnabled: (item: Pick<StartupItem, 'id' | 'name' | 'scope' | 'source'>, enabled: boolean) => Promise<void>
}

export function useStartup(): UseStartupResult {
  const [report, setReport] = useState<StartupReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    window.api.startup
      .getReport()
      .then((result) => setReport(result))
      .catch(() => setError('Could not read startup programs. Try again.'))
      .finally(() => setLoading(false))
  }, [])

  const setEnabled = useCallback(
    async (item: Pick<StartupItem, 'id' | 'name' | 'scope' | 'source'>, enabled: boolean) => {
      setTogglingId(item.id)
      setToggleError(null)
      try {
        const result = await window.api.startup.setEnabled(item, enabled)
        if (!result.success) {
          setToggleError(result.restorePointError ?? result.error ?? 'Change failed.')
        }
      } finally {
        setTogglingId(null)
        refresh()
      }
    },
    [refresh]
  )

  return { report, loading, error, refresh, togglingId, toggleError, setEnabled }
}
