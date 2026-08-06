import { ipcMain } from 'electron'
import { getSystemSpecs } from '../system/systemInfo'
import { runScan } from '../tweaks/scan'
import { runApplySession } from '../tweaks/applySession'
import { getDnsOverrideInfoForTweak } from '../tweaks/dns/applyDnsTweak'
import { getTweakById } from '../../../data/tweaks'
import type { ApplyOptions } from '../../shared/ipc-types'

export function registerTweaksIpcHandlers(): void {
  ipcMain.handle('tweaks:scan', async () => {
    const specs = await getSystemSpecs()
    return runScan(specs)
  })

  ipcMain.handle('tweaks:apply', (_event, tweakIds: string[], options?: ApplyOptions) =>
    runApplySession(tweakIds, options)
  )

  ipcMain.handle('tweaks:getDnsOverrideInfo', (_event, tweakId: string) => {
    const tweak = getTweakById(tweakId)
    if (!tweak) return null
    return getDnsOverrideInfoForTweak(tweak)
  })
}
