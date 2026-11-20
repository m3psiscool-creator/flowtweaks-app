import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

/**
 * What this PC knows locally about the account's access, kept so that a headless run (the
 * scheduled task, or the uninstaller) can act without the UI and without a signed-in session.
 *
 * 'trial'   — a free trial is running (or just ended and hasn't been reverted yet)
 * 'expired' — the trial ended and the tweaks have been reverted
 * 'paid'    — owns pc/both: tweaks are never auto-reverted
 *
 * The token is kept for 'trial'/'expired' only, so enforcement can ask the server "did this person
 * buy since?" even after they sign out. It's the same customer token account-session.json holds.
 */
export interface TrialLocalState {
  kind: 'trial' | 'expired' | 'paid'
  customerId: string
  token?: string
  endsAt?: string | null
  updatedAt: string
}

function getPath(): string {
  return join(app.getPath('userData'), 'trial-state.json')
}

export async function loadTrialState(): Promise<TrialLocalState | null> {
  try {
    return JSON.parse(await fs.readFile(getPath(), 'utf-8')) as TrialLocalState
  } catch {
    return null
  }
}

export async function saveTrialState(state: Omit<TrialLocalState, 'updatedAt'>): Promise<void> {
  const target = getPath()
  const tmp = `${target}.tmp`
  await fs.mkdir(join(target, '..'), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}

/**
 * Cross-process lock so the app and the headless scheduled-task run never revert at the same time
 * (both read-modify-write restore-history.json). Stale after 10 minutes in case a run was killed.
 */
export async function withEnforceLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const lock = join(app.getPath('userData'), 'trial-enforce.lock')
  await fs.mkdir(join(lock, '..'), { recursive: true })
  try {
    await fs.writeFile(lock, String(process.pid), { flag: 'wx' })
  } catch {
    try {
      const stat = await fs.stat(lock)
      if (Date.now() - stat.mtimeMs < 10 * 60 * 1000) return null
      await fs.rm(lock, { force: true })
      await fs.writeFile(lock, String(process.pid), { flag: 'wx' })
    } catch {
      return null
    }
  }
  try {
    return await fn()
  } finally {
    await fs.rm(lock, { force: true })
  }
}
