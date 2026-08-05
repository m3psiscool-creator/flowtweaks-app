import { ALL_TWEAKS } from '../../../data/tweaks'
import type { ScanReport, SystemSpecs, TweakCurrentState, TweakScanResult } from '../../shared/ipc-types'
import { runPowerShell } from '../system/powershell'
import { buildScanScript, collectDetectableOperations, keyFor } from './psScan'
import { evaluateOperation, type OpDetectResult } from './evaluateOperation'
import { evaluateCompatibility } from './compatibility'

function aggregateState(opResults: OpDetectResult[]): TweakCurrentState {
  if (opResults.length === 0) return 'unknown'
  const matchCount = opResults.filter((r) => r === 'match').length
  const errorCount = opResults.filter((r) => r === 'error').length
  if (errorCount === opResults.length) return 'unknown'
  if (matchCount === opResults.length) return 'already-enabled'
  if (matchCount === 0) return 'not-enabled'
  return 'partial'
}

export async function runScan(specs: SystemSpecs): Promise<ScanReport> {
  const operations = collectDetectableOperations(ALL_TWEAKS)
  const script = buildScanScript(operations)

  let raw: Record<string, unknown> = {}
  let isElevated = false
  try {
    const stdout = await runPowerShell(script)
    raw = JSON.parse(stdout)
    isElevated = raw.__elevated === true
  } catch {
    // Scan script itself failed to run — every tweak below falls back to 'unknown'.
  }

  const stateByTweak = new Map<string, TweakCurrentState>()
  for (const tweak of ALL_TWEAKS) {
    const opResults = operations
      .filter((op) => op.tweakId === tweak.id)
      .map((op) => evaluateOperation(op.operation, raw[keyFor(op.tweakId, op.opIndex)]))
    stateByTweak.set(tweak.id, aggregateState(opResults))
  }

  const enabledTweakIds = new Set(
    [...stateByTweak.entries()].filter(([, state]) => state === 'already-enabled').map(([id]) => id)
  )

  const results: TweakScanResult[] = ALL_TWEAKS.map((tweak) => {
    const compat = evaluateCompatibility(tweak.compatibility, specs, enabledTweakIds)
    return {
      tweakId: tweak.id,
      compatible: compat.compatible,
      incompatibilityReason: compat.reason,
      currentState: stateByTweak.get(tweak.id) ?? 'unknown',
      needsElevation: tweak.requiresAdmin && !isElevated
    }
  })

  return { isElevated, results }
}
