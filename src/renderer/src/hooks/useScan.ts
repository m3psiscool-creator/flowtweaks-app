import { useCallback, useState } from 'react'
import type { ScanReport } from '@shared/ipc-types'

interface UseScanResult {
  report: ScanReport | null
  scanning: boolean
  error: string | null
  runScan: () => void
}

export function useScan(): UseScanResult {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runScan = useCallback(() => {
    setScanning(true)
    setError(null)
    window.api.tweaks
      .scan()
      .then((result) => setReport(result))
      .catch(() => setError('Scan failed. Try again.'))
      .finally(() => setScanning(false))
  }, [])

  return { report, scanning, error, runScan }
}
