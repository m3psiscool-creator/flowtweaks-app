import { EventEmitter } from 'events'
import { getTweakById } from '../../../data/tweaks'
import { BOOST_GAMES } from '../../../data/boostGames'
import type { TweakDefinition } from '../../../data/schema'
import type { BoostConfig, BoostPhase, BoostStatus, SnapshotValue } from '../../shared/ipc-types'
import { runPowerShell, psQuote } from '../system/powershell'
import { captureSnapshots } from '../restore/snapshot'
import { applyOperation } from '../tweaks/applyOperation'
import { revertOperation } from '../restore/revert'

const POLL_INTERVAL_MS = 4000
const isTweak = (t: TweakDefinition | undefined): t is TweakDefinition => t !== undefined

/**
 * Only safe, instant, no-admin, no-restart tweaks belong here. Boost Mode applies and reverts
 * these every single game launch/close — going through the full customer-facing apply pipeline
 * (System Restore point + change log) for that would be far too slow and heavy (Windows throttles
 * restore point creation), and these changes are intentionally session-scoped, not a durable
 * customer change, so they're applied/reverted directly via the same snapshot primitives instead.
 */
const BOOST_TWEAK_IDS = ['game-mode', 'fullscreen-optimizations']

export const boostEvents = new EventEmitter()

let enabled = false
let config: BoostConfig | null = null
let phase: BoostPhase = 'idle'
let detectedProcess: string | null = null
let boostedSince: string | null = null
let lastError: string | null = null
let pollHandle: ReturnType<typeof setInterval> | null = null
let capturedSnapshots: Record<string, SnapshotValue | null> | null = null

function currentStatus(): BoostStatus {
  const game = config ? (BOOST_GAMES.find((g) => g.id === config!.gameId) ?? null) : null
  return {
    enabled,
    phase,
    gameId: config?.gameId ?? null,
    gameName: game?.name ?? null,
    detectedProcess,
    boostedSince,
    lastError
  }
}

function emitStatus(): void {
  boostEvents.emit('status', currentStatus())
}

function toBareNames(names: string[]): string {
  return names.map((n) => `'${psQuote(n.replace(/\.exe$/i, ''))}'`).join(',')
}

async function findRunningProcess(processNames: string[]): Promise<string | null> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$names = @(${toBareNames(processNames)})
$p = Get-Process -Name $names -ErrorAction SilentlyContinue | Select-Object -First 1
if ($p) { $p.ProcessName } else { '' }
exit 0`
  try {
    const stdout = await runPowerShell(script)
    return stdout.trim() || null
  } catch {
    return null
  }
}

async function setPriority(processNames: string[], priority: 'Idle' | 'Normal'): Promise<void> {
  if (processNames.length === 0) return
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$names = @(${toBareNames(processNames)})
foreach ($n in $names) {
  try { Get-Process -Name $n -ErrorAction Stop | ForEach-Object { $_.PriorityClass = '${priority}' } } catch {}
}
exit 0`
  await runPowerShell(script).catch(() => {})
}

async function applyBoostTweaks(): Promise<void> {
  const tweaks = BOOST_TWEAK_IDS.map((id) => getTweakById(id)).filter(isTweak)
  const requests = tweaks.flatMap((tweak) =>
    tweak.apply.map((operation, index) => ({ key: `${tweak.id}__${index}`, operation }))
  )
  capturedSnapshots = await captureSnapshots(requests)
  for (const tweak of tweaks) {
    for (const operation of tweak.apply) {
      await applyOperation(operation)
    }
  }
  if (config) await setPriority(config.pauseProcessNames, 'Idle')
}

async function revertBoostTweaks(): Promise<void> {
  const tweaks = BOOST_TWEAK_IDS.map((id) => getTweakById(id)).filter(isTweak)
  if (capturedSnapshots) {
    const snapshots = capturedSnapshots
    for (const tweak of tweaks) {
      for (let i = 0; i < tweak.apply.length; i++) {
        const snap = snapshots[`${tweak.id}__${i}`]
        if (snap) await revertOperation(tweak.apply[i], snap)
      }
    }
  }
  capturedSnapshots = null
  if (config) await setPriority(config.pauseProcessNames, 'Normal')
}

async function tick(): Promise<void> {
  if (!enabled || !config) return
  const game = BOOST_GAMES.find((g) => g.id === config!.gameId)
  if (!game) return

  const running = await findRunningProcess(game.processNames)

  if (running && phase !== 'boosted') {
    phase = 'boosted'
    detectedProcess = running
    boostedSince = new Date().toISOString()
    emitStatus()
    try {
      await applyBoostTweaks()
      lastError = null
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    emitStatus()
  } else if (!running && phase === 'boosted') {
    try {
      await revertBoostTweaks()
      lastError = null
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    phase = 'watching'
    detectedProcess = null
    boostedSince = null
    emitStatus()
  }
}

export function startBoost(newConfig: BoostConfig): BoostStatus {
  config = newConfig
  enabled = true
  phase = 'watching'
  lastError = null
  if (pollHandle) clearInterval(pollHandle)
  pollHandle = setInterval(() => {
    tick().catch(() => {})
  }, POLL_INTERVAL_MS)
  tick().catch(() => {})
  emitStatus()
  return currentStatus()
}

export async function stopBoost(): Promise<BoostStatus> {
  if (pollHandle) {
    clearInterval(pollHandle)
    pollHandle = null
  }
  if (phase === 'boosted') {
    try {
      await revertBoostTweaks()
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  enabled = false
  phase = 'idle'
  detectedProcess = null
  boostedSince = null
  config = null
  emitStatus()
  return currentStatus()
}

export function getBoostStatus(): BoostStatus {
  return currentStatus()
}

/** Best-effort "things worth pausing" list for the config UI — visible-window apps only, not every driver/service process. */
export async function listRunningProcessNames(): Promise<string[]> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -ExpandProperty ProcessName -Unique | Sort-Object
exit 0`
  try {
    const stdout = await runPowerShell(script)
    if (!stdout) return []
    return stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}
