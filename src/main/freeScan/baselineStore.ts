import { app } from 'electron'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { BaselineMeasurement } from '../../shared/ipc-types'

/**
 * Local history now, uploaded to the backend once Phase 6/7 exist (see CLAUDE-free-scan.md section
 * 5 — this history is the dataset that eventually replaces the seeded performanceRanges.json
 * estimates with real measured ranges). Kept as a flat array like wheel-state.json/restore's
 * change log, newest first, so "latest baseline" is just the first entry.
 */
function getStorePath(): string {
  return join(app.getPath('userData'), 'baseline-measurements.json')
}

async function loadHistory(): Promise<BaselineMeasurement[]> {
  try {
    const raw = await fs.readFile(getStorePath(), 'utf-8')
    const parsed = JSON.parse(raw) as BaselineMeasurement[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveHistory(history: BaselineMeasurement[]): Promise<void> {
  const target = getStorePath()
  const tmp = `${target}.tmp`
  await fs.mkdir(join(target, '..'), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(history, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}

export async function getLatestBaseline(): Promise<BaselineMeasurement | null> {
  const history = await loadHistory()
  return history[0] ?? null
}

export async function getBaselineHistory(): Promise<BaselineMeasurement[]> {
  return loadHistory()
}

export async function recordBaseline(
  result: Omit<BaselineMeasurement, 'id' | 'createdAt'>
): Promise<BaselineMeasurement> {
  const measurement: BaselineMeasurement = {
    ...result,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  }
  const history = await loadHistory()
  history.unshift(measurement)
  await saveHistory(history)
  return measurement
}
