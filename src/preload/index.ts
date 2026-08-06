import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AccountSession,
  AccountTicket,
  ApplyOptions,
  ApplySessionResult,
  BoostConfig,
  BoostStatus,
  CreateRestorePointResult,
  DiagnosticReport,
  DisableSessionResult,
  DnsOverrideInfo,
  ExportReportResult,
  RequestCodeResult,
  RestorePointInfo,
  RestoreSession,
  RevertResult,
  ScanReport,
  StartupItem,
  StartupReport,
  StartupToggleResult,
  SupportCodeResult,
  SystemSpecs,
  SystemUsage,
  TicketPlan,
  WheelState
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
    disable: (tweakIds: string[]): Promise<DisableSessionResult> =>
      ipcRenderer.invoke('tweaks:disable', tweakIds),
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
      ipcRenderer.invoke('restore:revertTweakInSession', sessionId, tweakId),
    revertAll: (): Promise<RevertResult> => ipcRenderer.invoke('restore:revertAll')
  },
  wheel: {
    getState: (): Promise<WheelState> => ipcRenderer.invoke('wheel:getState'),
    spin: (): Promise<WheelState> => ipcRenderer.invoke('wheel:spin')
  },
  diagnostics: {
    getReport: (): Promise<DiagnosticReport> => ipcRenderer.invoke('diagnostics:getReport'),
    exportReport: (): Promise<ExportReportResult> => ipcRenderer.invoke('diagnostics:exportReport'),
    generateSupportCode: (): Promise<SupportCodeResult> =>
      ipcRenderer.invoke('diagnostics:generateSupportCode'),
    revealFile: (filePath: string): Promise<void> => ipcRenderer.invoke('diagnostics:revealFile', filePath)
  },
  boost: {
    getStatus: (): Promise<BoostStatus> => ipcRenderer.invoke('boost:getStatus'),
    start: (config: BoostConfig): Promise<BoostStatus> => ipcRenderer.invoke('boost:start', config),
    stop: (): Promise<BoostStatus> => ipcRenderer.invoke('boost:stop'),
    listRunningProcesses: (): Promise<string[]> => ipcRenderer.invoke('boost:listRunningProcesses'),
    onStatus: (callback: (status: BoostStatus) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: BoostStatus): void => callback(status)
      ipcRenderer.on('boost:status', listener)
      return () => ipcRenderer.removeListener('boost:status', listener)
    }
  },
  startup: {
    getReport: (): Promise<StartupReport> => ipcRenderer.invoke('startup:getReport'),
    setEnabled: (
      item: Pick<StartupItem, 'id' | 'name' | 'scope' | 'source'>,
      enabled: boolean
    ): Promise<StartupToggleResult> => ipcRenderer.invoke('startup:setEnabled', item, enabled)
  },
  account: {
    getSession: (): Promise<AccountSession | null> => ipcRenderer.invoke('account:getSession'),
    requestCode: (email: string, plan?: TicketPlan): Promise<RequestCodeResult> =>
      ipcRenderer.invoke('account:requestCode', email, plan),
    verifyCode: (email: string, code: string): Promise<AccountSession> =>
      ipcRenderer.invoke('account:verifyCode', email, code),
    staffLogin: (username: string, password: string): Promise<AccountSession> =>
      ipcRenderer.invoke('account:staffLogin', username, password),
    logout: (): Promise<void> => ipcRenderer.invoke('account:logout'),
    getMyTickets: (): Promise<AccountTicket[]> => ipcRenderer.invoke('account:getMyTickets'),
    getStaffTickets: (): Promise<AccountTicket[]> => ipcRenderer.invoke('account:getStaffTickets')
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
