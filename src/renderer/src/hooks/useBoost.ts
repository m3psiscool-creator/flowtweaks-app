import { useCallback, useEffect, useState } from 'react'
import type { BoostConfig, BoostStatus } from '@shared/ipc-types'

interface UseBoostResult {
  status: BoostStatus | null
  starting: boolean
  stopping: boolean
  runningProcesses: string[]
  loadingProcesses: boolean
  refreshRunningProcesses: () => void
  start: (config: BoostConfig) => Promise<void>
  stop: () => Promise<void>
}

export function useBoost(): UseBoostResult {
  const [status, setStatus] = useState<BoostStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [runningProcesses, setRunningProcesses] = useState<string[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)

  useEffect(() => {
    window.api.boost.getStatus().then(setStatus)
    return window.api.boost.onStatus(setStatus)
  }, [])

  const refreshRunningProcesses = useCallback(() => {
    setLoadingProcesses(true)
    window.api.boost
      .listRunningProcesses()
      .then(setRunningProcesses)
      .finally(() => setLoadingProcesses(false))
  }, [])

  const start = useCallback(async (config: BoostConfig) => {
    setStarting(true)
    try {
      setStatus(await window.api.boost.start(config))
    } finally {
      setStarting(false)
    }
  }, [])

  const stop = useCallback(async () => {
    setStopping(true)
    try {
      setStatus(await window.api.boost.stop())
    } finally {
      setStopping(false)
    }
  }, [])

  return { status, starting, stopping, runningProcesses, loadingProcesses, refreshRunningProcesses, start, stop }
}
