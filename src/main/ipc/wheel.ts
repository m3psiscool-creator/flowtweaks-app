import { ipcMain } from 'electron'
import { getWheelState, spinWheel } from '../wheel/wheelStore'

export function registerWheelIpcHandlers(): void {
  ipcMain.handle('wheel:getState', () => getWheelState())
  ipcMain.handle('wheel:spin', () => spinWheel())
}
