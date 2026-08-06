import { ipcMain } from 'electron'
import { getStartupReport, toggleStartupItem } from '../startup'
import type { StartupItem } from '../../shared/ipc-types'

export function registerStartupIpcHandlers(): void {
  ipcMain.handle('startup:getReport', () => getStartupReport())
  ipcMain.handle(
    'startup:setEnabled',
    (_event, item: Pick<StartupItem, 'id' | 'name' | 'scope' | 'source'>, enabled: boolean) =>
      toggleStartupItem(item, enabled)
  )
}
