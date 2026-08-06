import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ApplyOptions,
  ApplySessionResult,
  CreateRestorePointResult,
  DnsOverrideInfo,
  RestorePointInfo,
  RestoreSession,
  RevertResult,
  ScanReport,
  SystemSpecs,
  SystemUsage
} from '../shared/ipc-types'

const api = {
  system: {
    getSpecs: (): Promise<SystemSpecs> => ipcRenderer.invoke('system:getSpecs'),
    onUsage: (callback: (usage: SystemUsage) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, usage: SystemUsage): void =>
        callback(usage)
      ipcRenderer.on('system:usage', listener)
      return () => ipcRenderer.removeListener('system:usage', listener)
    }
  },
  tweaks: {
    scan: (): Promise<ScanReport> => ipcRenderer.invoke('tweaks:scan'),
    apply: (tweakIds: string[], options?: ApplyOptions): Promise<ApplySessionResult> =>
      ipcRenderer.invoke('tweaks:apply', tweakIds, options),
    getDnsOverrideInfo: (tweakId: string): Promise<DnsOverrideInfo | null> =>
      ipcRenderer.invoke('tweaks:getDnsOverrideInfo', tweakId)
  },
  restore: {
    createPoint: (description?: string): Promise<CreateRestorePointResult> =>
      ipcRenderer.invoke('restore:createPoint', description),
    listPoints: (): Promise<RestorePointInfo[]> => ipcRenderer.invoke('restore:listPoints'),
    getSessions: (): Promise<RestoreSession[]> => ipcRenderer.invoke('restore:getSessions'),
    revertEntry: (entryId: string): Promise<RevertResult> =>
      ipcRenderer.invoke('restore:revertEntry', entryId),
    revertSession: (sessionId: string): Promise<RevertResult> =>
      ipcRenderer.invoke('restore:revertSession', sessionId),
    revertTweakInSession: (sessionId: string, tweakId: string): Promise<RevertResult> =>
      ipcRenderer.invoke('restore:revertTweakInSession', sessionId, tweakId)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type Api = typeof api
