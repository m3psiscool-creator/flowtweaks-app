import { ipcMain, BrowserWindow } from 'electron'
import { getSystemSpecs, getSystemUsage } from '../system/systemInfo'

const USAGE_PUSH_INTERVAL_MS = 1500

/** Registers the one-shot specs handler. Call once at app startup. */
export function registerSystemIpcHandlers(): void {
  ipcMain.handle('system:getSpecs', () => getSystemSpecs())
}

/** Starts pushing live usage to one window until it closes. Call per window. */
export function startUsagePush(window: BrowserWindow): void {
  const interval = setInterval(async () => {
    if (window.isDestroyed()) {
      clearInterval(interval)
      return
    }
    const usage = await getSystemUsage()
    window.webContents.send('system:usage', usage)
  }, USAGE_PUSH_INTERVAL_MS)

  window.on('closed', () => clearInterval(interval))
}
