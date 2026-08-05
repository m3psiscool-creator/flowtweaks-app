import { ipcMain } from 'electron'
import { getSystemSpecs } from '../system/systemInfo'
import { runScan } from '../tweaks/scan'
import { runApplySession } from '../tweaks/applySession'

export function registerTweaksIpcHandlers(): void {
  ipcMain.handle('tweaks:scan', async () => {
    const specs = await getSystemSpecs()
    return runScan(specs)
  })

  ipcMain.handle('tweaks:apply', (_event, tweakIds: string[]) => runApplySession(tweakIds))
}
