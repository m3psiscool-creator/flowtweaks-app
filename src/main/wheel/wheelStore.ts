import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { WheelState } from '../../shared/ipc-types'

/**
 * The one tweak given away free via the spin mechanic. Fullscreen Optimizations was picked over
 * the higher-friction admin/restart tweaks (CPU & Network Scheduling, HAGS) specifically because
 * it applies instantly with no elevation and no reboot — a first-time, no-account visitor should
 * always be able to actually claim what they won, not hit a UAC prompt on their first minute in
 * the app. It's also one of the most noticeable input-latency wins for competitive shooters (true
 * exclusive fullscreen vs. the borderless-style compositor Windows substitutes by default).
 */
export const FREE_TWEAK_ID = 'fullscreen-optimizations'

function getStorePath(): string {
  return join(app.getPath('userData'), 'wheel-state.json')
}

const DEFAULT_STATE: WheelState = { spun: false, unlockedTweakId: null, spunAt: null }

export async function getWheelState(): Promise<WheelState> {
  try {
    const raw = await fs.readFile(getStorePath(), 'utf-8')
    return JSON.parse(raw) as WheelState
  } catch {
    return DEFAULT_STATE
  }
}

async function saveWheelState(state: WheelState): Promise<void> {
  const target = getStorePath()
  const tmp = `${target}.tmp`
  await fs.mkdir(join(target, '..'), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf-8')
  await fs.rename(tmp, target)
}

/**
 * Idempotent by design — spinning again after the first time returns the same result rather than
 * re-rolling. The prize is fixed (see FREE_TWEAK_ID); the wheel's job is presentation, not chance.
 * The only way to spin again is clearing app data (deletes this file), matching the "one-time,
 * no-account" mechanic described in the plan.
 */
export async function spinWheel(): Promise<WheelState> {
  const existing = await getWheelState()
  if (existing.spun) return existing

  const state: WheelState = {
    spun: true,
    unlockedTweakId: FREE_TWEAK_ID,
    spunAt: new Date().toISOString()
  }
  await saveWheelState(state)
  return state
}
