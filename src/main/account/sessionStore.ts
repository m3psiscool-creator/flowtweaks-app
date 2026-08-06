import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { AccountSession } from '../../shared/ipc-types'

function getStorePath(): string {
  return join(app.getPath('userData'), 'account-session.json')
}

export async function loadSession(): Promise<AccountSession | null> {
  try {
    const raw = await fs.readFile(getStorePath(), 'utf-8')
    return JSON.parse(raw) as AccountSession
  } catch {
    return null
  }
}

export async function saveSession(session: AccountSession | null): Promise<void> {
  const target = getStorePath()
  if (session === null) {
    await fs.rm(target, { force: true })
    return
  }
  const tmp = `${target}.tmp`
  await fs.mkdir(join(target, '..'), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(session, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}
