import { ipcMain, BrowserWindow } from 'electron'
import {
  boostEvents,
  getBoostStatus,
  listRunningProcessNames,
  startBoost,
  stopBoost
} from '../boost/boostService'
import type { BoostConfig, BoostStatus } from '../../shared/ipc-types'

export function registerBoostIpcHandlers(): void {
  ipcMain.handle('boost:getStatus', () => getBoostStatus())
  ipcMain.handle('boost:start', (_event, config: BoostConfig) => startBoost(config))
  ipcMain.handle('boost:stop', () => stopBoost())
  ipcMain.handle('boost:listRunningProcesses', () => listRunningProcessNames())
}

/** Pushes boost status to one window whenever it changes, so the UI doesn't have to poll. */
export function attachBoostStatusPush(window: BrowserWindow): void {
  const listener = (status: BoostStatus): void => {
    if (!window.isDestroyed()) window.webContents.send('boost:status', status)
  }
  boostEvents.on('status', listener)
  window.on('closed', () => boostEvents.off('status', listener))
}
