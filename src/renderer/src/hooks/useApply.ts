import { useCallback, useState } from 'react'
import type { ApplySessionResult } from '@shared/ipc-types'

interface UseApplyResult {
  applying: boolean
  result: ApplySessionResult | null
  apply: (tweakIds: string[]) => Promise<void>
  reset: () => void
}

export function useApply(): UseApplyResult {
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<ApplySessionResult | null>(null)

  const apply = useCallback(async (tweakIds: string[]) => {
    setApplying(true)
    setResult(null)
    try {
      const r = await window.api.tweaks.apply(tweakIds)
      setResult(r)
    } finally {
      setApplying(false)
    }
  }, [])

  const reset = useCallback(() => setResult(null), [])

  return { applying, result, apply, reset }
}
