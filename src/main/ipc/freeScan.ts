import { ipcMain } from 'electron'
import { buildFreeScanReport } from '../freeScan/freeScanReport'
import { getLatestBaseline, recordBaseline } from '../freeScan/baselineStore'
import { submitFreeScanResults, submitFreeScanBeforeAfter } from '../account/backendClient'
import type { BaselineMeasurement, FreeScanBeforeAfterSubmission, FreeScanSubmission } from '../../shared/ipc-types'

export function registerFreeScanIpcHandlers(): void {
  ipcMain.handle('freeScan:run', () => buildFreeScanReport())
  ipcMain.handle('freeScan:getLatestBaseline', () => getLatestBaseline())
  ipcMain.handle(
    'freeScan:recordBaseline',
    (_event, result: Omit<BaselineMeasurement, 'id' | 'createdAt'>) => recordBaseline(result)
  )
  ipcMain.handle('freeScan:submitResults', (_event, payload: FreeScanSubmission) =>
    submitFreeScanResults(payload)
  )
  ipcMain.handle('freeScan:submitBeforeAfter', (_event, payload: FreeScanBeforeAfterSubmission) =>
    submitFreeScanBeforeAfter(payload)
  )
}
