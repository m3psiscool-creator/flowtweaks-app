import { ipcMain } from 'electron'
import { getSystemSpecs } from '../system/systemInfo'
import { runScan } from '../tweaks/scan'
import { runApplySession } from '../tweaks/applySession'
import { runDisableSession } from '../tweaks/disableSession'
import { getDnsOverrideInfoForTweak } from '../tweaks/dns/applyDnsTweak'
import { getTweakById } from '../../../data/tweaks'
import { hasValidLicense } from '../account/license'
import type { ApplyOptions } from '../../shared/ipc-types'

const NOT_LICENSED_ERROR =
  'This account is not licensed to apply tweaks. Sign in and unlock a plan from Billing first.'

export function registerTweaksIpcHandlers(): void {
  ipcMain.handle('tweaks:scan', async () => {
    const specs = await getSystemSpecs()
    return runScan(specs)
  })

  // Scanning stays open to everyone (read-only). Actually changing the PC is the gated part — the
  // renderer already disables these buttons for unlicensed accounts, but that's just UX; this is
  // the real gate, since nothing stops a patched renderer or a direct IPC call from skipping it.
  ipcMain.handle('tweaks:apply', async (_event, tweakIds: string[], options?: ApplyOptions) => {
    if (!(await hasValidLicense())) throw new Error(NOT_LICENSED_ERROR)
    return runApplySession(tweakIds, options)
  })

  ipcMain.handle('tweaks:disable', async (_event, tweakIds: string[]) => {
    if (!(await hasValidLicense())) throw new Error(NOT_LICENSED_ERROR)
    return runDisableSession(tweakIds)
  })

  ipcMain.handle('tweaks:getDnsOverrideInfo', (_event, tweakId: string) => {
    const tweak = getTweakById(tweakId)
    if (!tweak) return null
    return getDnsOverrideInfoForTweak(tweak)
  })
}
