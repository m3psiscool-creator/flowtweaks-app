import type { Operation } from '../../../data/schema'
import { runPowerShell } from '../system/powershell'
import { buildRegistryWriteScript } from '../system/registryWrite'

export interface ApplyResult {
  success: boolean
  error?: string
}

/**
 * Only 'registry' is implemented — this phase only enables the Personalization category
 * (Dark Mode), which is registry-only. Other operation types get their apply logic when their
 * category is turned on, reusing the same tested capture/apply/log/revert pipeline.
 */
export async function applyOperation(operation: Operation): Promise<ApplyResult> {
  try {
    if (operation.type === 'registry') {
      const script = buildRegistryWriteScript(
        operation.hive,
        operation.path,
        operation.valueName,
        operation.valueType,
        operation.desiredValue
      )
      await runPowerShell(script)
      return { success: true }
    }
    return { success: false, error: `Applying operation type "${operation.type}" isn't implemented yet.` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
