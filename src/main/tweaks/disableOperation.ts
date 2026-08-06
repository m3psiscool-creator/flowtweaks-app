import type { Operation } from '../../../data/schema'
import { runPowerShell } from '../system/powershell'
import { buildRegistryWriteScript } from '../system/registryWrite'

export interface ApplyResult {
  success: boolean
  error?: string
}

/**
 * Mirrors applyOperation.ts, writing each operation's disabledValue instead of desiredValue.
 * Only 'registry' is implemented, matching applyOperation's current scope — every apply-enabled
 * tweak today is registry-only (see data/applyEnabled.ts).
 */
export async function disableOperation(operation: Operation): Promise<ApplyResult> {
  try {
    if (operation.type === 'registry') {
      const script = buildRegistryWriteScript(
        operation.hive,
        operation.path,
        operation.valueName,
        operation.valueType,
        operation.disabledValue
      )
      await runPowerShell(script)
      return { success: true }
    }
    return { success: false, error: `Disabling operation type "${operation.type}" isn't implemented yet.` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
