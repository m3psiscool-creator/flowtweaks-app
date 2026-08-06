import { app, dialog } from 'electron'
import { randomBytes } from 'crypto'
import { join } from 'path'
import { promises as fs } from 'fs'
import { getSystemSpecs } from '../system/systemInfo'
import { runScan } from '../tweaks/scan'
import { getSessions } from '../restore/changeLog'
import { getWheelState } from '../wheel/wheelStore'
import type { DiagnosticReport } from '../../shared/ipc-types'

export async function buildDiagnosticReport(): Promise<DiagnosticReport> {
  const specs = await getSystemSpecs()
  const [scan, sessions, wheel] = await Promise.all([runScan(specs), getSessions(), getWheelState()])
  return { generatedAt: new Date().toISOString(), specs, scan, sessions, wheel }
}

function diagnosticsDir(): string {
  return join(app.getPath('userData'), 'diagnostics')
}

/** 8 hex chars — short enough to read over Discord, long enough that collisions don't matter here. */
function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

/**
 * Saves the report locally under the code rather than uploading anywhere — there's no backend to
 * receive it yet (see CLAUDE.md's later-phases list for Account/licensing). The customer attaches
 * the file when opening a Discord ticket; staff read it directly, same as today's manual sessions.
 */
export async function generateSupportCode(): Promise<{ code: string; filePath: string }> {
  const report = await buildDiagnosticReport()
  const code = generateCode()
  const dir = diagnosticsDir()
  await fs.mkdir(dir, { recursive: true })
  const filePath = join(dir, `${code}.json`)
  await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8')
  return { code, filePath }
}

export async function exportReportToFile(): Promise<{ filePath: string | null }> {
  const report = await buildDiagnosticReport()
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Diagnostic Report',
    defaultPath: `flow-tweaks-diagnostic-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { filePath: null }
  await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8')
  return { filePath }
}
