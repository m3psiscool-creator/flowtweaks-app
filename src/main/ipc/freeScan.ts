import { ipcMain } from 'electron'
import { buildFreeScanReport } from '../freeScan/freeScanReport'
import { submitFreeScanResults } from '../account/backendClient'
import type { FreeScanSubmission } from '../../shared/ipc-types'

export function registerFreeScanIpcHandlers(): void {
  ipcMain.handle('freeScan:run', () => buildFreeScanReport())
  ipcMain.handle('freeScan:submitResults', (_event, payload: FreeScanSubmission) =>
    submitFreeScanResults(payload)
  )
}
