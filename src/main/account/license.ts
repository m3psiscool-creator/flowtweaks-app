import { resolveAccess } from '../trial/access'

// Runs in the main process, ahead of tweaks:apply and tweaks:disable, so a customer can't unlock
// tweaks just by skipping the renderer's UI gate and invoking the IPC channel directly. Licensed
// means: staff, a pc/both purchase, or a running free trial (all decided by the server).
export async function hasValidLicense(): Promise<boolean> {
  return (await resolveAccess()).licensed
}
