import { app, BrowserWindow, dialog } from 'electron'
// electron-updater is CommonJS — under Node's ESM loader (this app is "type": "module") a named
// import silently fails at runtime with "Named export 'autoUpdater' not found" even though
// TypeScript's typecheck doesn't catch it, since ESM can't statically know a CJS module's named
// exports. Import the default and destructure instead.
import pkg from 'electron-updater'
const { autoUpdater } = pkg

/**
 * Checks GitHub Releases (per package.json's build.publish config) once per launch, downloads
 * silently in the background, then asks before restarting to install — never interrupts a
 * customer mid-session. Matches CLAUDE.md's "resident piece" philosophy: nothing runs unless the
 * app itself is open.
 */
export function initAutoUpdater(): void {
  // Dev/unpacked runs have no app-update.yml (electron-builder only writes it into a packaged
  // build) — checking there would just throw, so skip entirely outside a real install.
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', (info) => {
    const win = BrowserWindow.getAllWindows()[0]
    dialog
      .showMessageBox(win, {
        type: 'info',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
        title: 'Update Ready',
        message: `Flow Tweaks ${info.version} is ready to install`,
        detail: 'Restart now to finish updating, or keep working — it installs automatically next time you quit.'
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (err) => {
    // Never fatal — a failed update check shouldn't block using the app.
    console.error('Auto-update check failed:', err)
  })

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('Auto-update check failed:', err)
  })
}
