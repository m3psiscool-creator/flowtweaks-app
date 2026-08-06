import { ipcMain, shell } from 'electron'
import { buildDiagnosticReport, exportReportToFile, generateSupportCode } from '../diagnostics/report'

export function registerDiagnosticsIpcHandlers(): void {
  ipcMain.handle('diagnostics:getReport', () => buildDiagnosticReport())
  ipcMain.handle('diagnostics:exportReport', () => exportReportToFile())
  ipcMain.handle('diagnostics:generateSupportCode', () => generateSupportCode())
  ipcMain.handle('diagnostics:revealFile', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}
