import { useCallback, useState } from 'react'
import type { DiagnosticReport, ExportReportResult, RevertResult, SupportCodeResult } from '@shared/ipc-types'

interface UseDiagnosticsResult {
  report: DiagnosticReport | null
  loading: boolean
  refresh: () => void
  exporting: boolean
  exportResult: ExportReportResult | null
  exportReport: () => Promise<void>
  generating: boolean
  supportCode: SupportCodeResult | null
  generateSupportCode: () => Promise<void>
  restoringDefaults: boolean
  restoreDefaultsResult: RevertResult | null
  restoreDefaults: () => Promise<void>
}

export function useDiagnostics(): UseDiagnosticsResult {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportReportResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [supportCode, setSupportCode] = useState<SupportCodeResult | null>(null)
  const [restoringDefaults, setRestoringDefaults] = useState(false)
  const [restoreDefaultsResult, setRestoreDefaultsResult] = useState<RevertResult | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    window.api.diagnostics
      .getReport()
      .then(setReport)
      .finally(() => setLoading(false))
  }, [])

  const exportReport = useCallback(async () => {
    setExporting(true)
    try {
      setExportResult(await window.api.diagnostics.exportReport())
    } finally {
      setExporting(false)
    }
  }, [])

  const generateSupportCode = useCallback(async () => {
    setGenerating(true)
    try {
      setSupportCode(await window.api.diagnostics.generateSupportCode())
    } finally {
      setGenerating(false)
    }
  }, [])

  const restoreDefaults = useCallback(async () => {
    setRestoringDefaults(true)
    try {
      const result = await window.api.restore.revertAll()
      setRestoreDefaultsResult(result)
      refresh()
    } finally {
      setRestoringDefaults(false)
    }
  }, [refresh])

  return {
    report,
    loading,
    refresh,
    exporting,
    exportResult,
    exportReport,
    generating,
    supportCode,
    generateSupportCode,
    restoringDefaults,
    restoreDefaultsResult,
    restoreDefaults
  }
}
