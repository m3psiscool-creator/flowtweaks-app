import { useCallback, useState } from 'react'
import type { DisableSessionResult } from '@shared/ipc-types'

interface UseDisableResult {
  disabling: boolean
  result: DisableSessionResult | null
  disable: (tweakIds: string[]) => Promise<void>
  reset: () => void
}

export function useDisable(): UseDisableResult {
  const [disabling, setDisabling] = useState(false)
  const [result, setResult] = useState<DisableSessionResult | null>(null)

  const disable = useCallback(async (tweakIds: string[]) => {
    setDisabling(true)
    setResult(null)
    try {
      const r = await window.api.tweaks.disable(tweakIds)
      setResult(r)
    } finally {
      setDisabling(false)
    }
  }, [])

  const reset = useCallback(() => setResult(null), [])

  return { disabling, result, disable, reset }
}
