import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { RestoreSession } from '../../shared/ipc-types'

function getStorePath(): string {
  return join(app.getPath('userData'), 'restore-history.json')
}

export async function loadSessions(): Promise<RestoreSession[]> {
  try {
    const raw = await fs.readFile(getStorePath(), 'utf-8')
    return JSON.parse(raw) as RestoreSession[]
  } catch {
    return []
  }
}

/** Write-to-temp-then-rename so a crash mid-write can't corrupt the log — this file is the only record of what changed. */
export async function saveSessions(sessions: RestoreSession[]): Promise<void> {
  const target = getStorePath()
  const tmp = `${target}.tmp`
  await fs.mkdir(join(target, '..'), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(sessions, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}
