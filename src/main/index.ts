import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerSystemIpcHandlers, startUsagePush } from './ipc/system'
import { registerTweaksIpcHandlers } from './ipc/tweaks'
import { registerRestoreIpcHandlers } from './ipc/restore'
import { registerWheelIpcHandlers } from './ipc/wheel'
import { registerDiagnosticsIpcHandlers } from './ipc/diagnostics'
import { registerBoostIpcHandlers, attachBoostStatusPush } from './ipc/boost'
import { stopBoost, getBoostStatus } from './boost/boostService'
import { registerAccountIpcHandlers } from './ipc/account'
import { relaunchElevatedIfNeeded } from './system/selfElevate'
import { reconcilePendingEntries } from './restore/reconcile'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d0d0d',
    // Windows' default title bar is light/system-themed and clashes with the app's black brand —
    // titleBarOverlay keeps the native minimize/maximize/close buttons (unlike frame: false, which
    // would mean building and maintaining custom window controls) but recolors the bar itself.
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0d0d0d',
      symbolColor: '#ffffff',
      height: 32
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  startUsagePush(mainWindow)
  attachBoostStatusPush(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // Most tweaks need admin rights (HKLM writes, restore points), so the app asks for elevation
  // up front via a real UAC prompt rather than making the customer relaunch it manually. Declined
  // or failed elevation isn't fatal — falls through to running unelevated, same as always.
  if (process.platform === 'win32' && (await relaunchElevatedIfNeeded())) {
    app.quit()
    return
  }

  electronApp.setAppUserModelId('com.flowtweaks.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerSystemIpcHandlers()
  registerTweaksIpcHandlers()
  registerRestoreIpcHandlers()
  registerWheelIpcHandlers()
  registerDiagnosticsIpcHandlers()
  registerBoostIpcHandlers()
  registerAccountIpcHandlers()

  // Resolve any change log entries left 'pending' by a crash before the UI can touch them.
  await reconcilePendingEntries()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// If Boost Mode is mid-boost when the app quits, its temporary tweaks and paused-process
// priorities must not be left stuck — revert before the process actually exits.
let quittingCleanly = false
app.on('before-quit', (event) => {
  if (quittingCleanly || getBoostStatus().phase !== 'boosted') return
  event.preventDefault()
  stopBoost().finally(() => {
    quittingCleanly = true
    app.quit()
  })
})
