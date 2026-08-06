import { ALL_TWEAKS } from '../../../data/tweaks'
import type { TweakDefinition } from '../../../data/schema'
import type { ScanReport, SystemSpecs, TweakCurrentState, TweakScanResult } from '../../shared/ipc-types'
import { runPowerShell } from '../system/powershell'
import { buildScanScript, collectDetectableOperations, keyFor } from './psScan'
import { evaluateOperation, type OpDetectResult } from './evaluateOperation'
import { evaluateCompatibility } from './compatibility'
import { evaluateDnsScanState } from './dns/dnsScanState'

function aggregateState(opResults: OpDetectResult[]): TweakCurrentState {
  if (opResults.length === 0) return 'unknown'
  const matchCount = opResults.filter((r) => r === 'match').length
  const errorCount = opResults.filter((r) => r === 'error').length
  if (errorCount === opResults.length) return 'unknown'
  if (matchCount === opResults.length) return 'already-enabled'
  if (matchCount === 0) return 'not-enabled'
  return 'partial'
}

async function runBatchScan(registryLikeTweaks: TweakDefinition[]) {
  const operations = collectDetectableOperations(registryLikeTweaks)
  const script = buildScanScript(operations)
  try {
    const stdout = await runPowerShell(script)
    const raw = JSON.parse(stdout) as Record<string, unknown>
    return { operations, raw, isElevated: raw.__elevated === true }
  } catch {
    // Scan script itself failed to run — every tweak below falls back to 'unknown'.
    return { operations, raw: {} as Record<string, unknown>, isElevated: false }
  }
}

export async function runScan(specs: SystemSpecs): Promise<ScanReport> {
  const dnsTweaks = ALL_TWEAKS.filter((t) => t.apply.some((op) => op.type === 'networkDns'))
  const registryLikeTweaks = ALL_TWEAKS.filter((t) => !dnsTweaks.includes(t))

  // DNS's own dedicated, adapter-aware evaluation (see src/main/tweaks/dns/) is fully independent
  // of the batched registry/service/powerPlan scan script — run both concurrently.
  const [batch, dnsPartials] = await Promise.all([
    runBatchScan(registryLikeTweaks),
    Promise.all(dnsTweaks.map((tweak) => evaluateDnsScanState(tweak)))
  ])
  const { operations, raw, isElevated } = batch

  const stateByTweak = new Map<string, TweakCurrentState>()
  for (const tweak of registryLikeTweaks) {
    const opResults = operations
      .filter((op) => op.tweakId === tweak.id)
      .map((op) => evaluateOperation(op.operation, raw[keyFor(op.tweakId, op.opIndex)]))
    stateByTweak.set(tweak.id, aggregateState(opResults))
  }

  const enabledTweakIds = new Set(
    [...stateByTweak.entries()].filter(([, state]) => state === 'already-enabled').map(([id]) => id)
  )

  const registryResults: TweakScanResult[] = registryLikeTweaks.map((tweak) => {
    const compat = evaluateCompatibility(tweak.compatibility, specs, enabledTweakIds)
    return {
      tweakId: tweak.id,
      compatible: compat.compatible,
      incompatibilityReason: compat.reason,
      currentState: stateByTweak.get(tweak.id) ?? 'unknown',
      needsElevation: tweak.requiresAdmin && !isElevated
    }
  })

  const dnsResults: TweakScanResult[] = dnsPartials.map((partial, i) => ({
    ...partial,
    needsElevation: dnsTweaks[i].requiresAdmin && !isElevated
  }))

  return { isElevated, results: [...registryResults, ...dnsResults] }
}
