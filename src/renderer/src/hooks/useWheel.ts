import { useCallback, useEffect, useState } from 'react'
import type { WheelState } from '@shared/ipc-types'

interface UseWheelResult {
  state: WheelState | null
  loading: boolean
  spinning: boolean
  spin: () => Promise<WheelState>
}

export function useWheel(): UseWheelResult {
  const [state, setState] = useState<WheelState | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    window.api.wheel
      .getState()
      .then(setState)
      .finally(() => setLoading(false))
  }, [])

  const spin = useCallback(async () => {
    setSpinning(true)
    try {
      const result = await window.api.wheel.spin()
      setState(result)
      return result
    } finally {
      setSpinning(false)
    }
  }, [])

  return { state, loading, spinning, spin }
}
