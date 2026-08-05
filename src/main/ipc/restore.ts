import { ipcMain } from 'electron'
import { createRestorePoint, listRestorePoints } from '../restore/restorePoint'
import { getSessions, revertEntry, revertSession, revertTweakInSession } from '../restore/changeLog'

export function registerRestoreIpcHandlers(): void {
  ipcMain.handle('restore:createPoint', (_event, description?: string) => createRestorePoint(description))
  ipcMain.handle('restore:listPoints', () => listRestorePoints())
  ipcMain.handle('restore:getSessions', () => getSessions())
  ipcMain.handle('restore:revertEntry', (_event, entryId: string) => revertEntry(entryId))
  ipcMain.handle('restore:revertSession', (_event, sessionId: string) => revertSession(sessionId))
  ipcMain.handle('restore:revertTweakInSession', (_event, sessionId: string, tweakId: string) =>
    revertTweakInSession(sessionId, tweakId)
  )
}
