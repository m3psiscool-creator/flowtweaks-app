import type { Operation } from '../../../data/schema'
import type { RevertResult, SnapshotValue } from '../../shared/ipc-types'
import { runPowerShell, psQuote } from '../system/powershell'
import { buildRegistryWriteScript } from '../system/registryWrite'
import { buildDnsWriteScript } from '../system/dnsWrite'

function buildRegistryRevertScript(
  hive: 'HKCU' | 'HKLM',
  path: string,
  valueName: string,
  valueType: 'REG_DWORD' | 'REG_SZ' | 'REG_BINARY',
  snapshot: SnapshotValue & { kind: 'registry' }
): string {
  if (!snapshot.present) {
    const keyPath = `${hive}:\\${psQuote(path)}`
    const name = psQuote(valueName)
    // Windows PowerShell sets a non-zero exit code for ANY non-terminating error during the
    // session — even one caught by try/catch, since the error record still lands in $Error.
    // The trailing `exit 0` is only reached if the try/catch actually ran to completion, so a
    // genuinely different (uncaught) failure earlier in the script still fails correctly.
    //
    // keyExisted === false means the whole key was created by apply — deleting only the value
    // would leave an empty key behind, so remove the key entirely. Entries logged before this
    // field existed have keyExisted === undefined, which we treat as true (the safe assumption:
    // only ever delete the value, never a key we didn't confirm we created).
    if (snapshot.keyExisted === false) {
      return `try { Remove-Item -Path '${keyPath}' -Recurse -Force -ErrorAction Stop } catch {}\nexit 0`
    }
    return `try { Remove-ItemProperty -Path '${keyPath}' -Name '${name}' -ErrorAction Stop } catch {}\nexit 0`
  }

  return buildRegistryWriteScript(hive, path, valueName, valueType, snapshot.raw as string | number)
}

export async function revertOperation(
  operation: Operation,
  previousValue: SnapshotValue
): Promise<RevertResult> {
  try {
    let script: string

    if (operation.type === 'registry' && previousValue.kind === 'registry') {
      script = buildRegistryRevertScript(
        operation.hive,
        operation.path,
        operation.valueName,
        operation.valueType,
        previousValue
      )
    } else if (operation.type === 'service' && previousValue.kind === 'service') {
      const name = psQuote(operation.serviceName)
      const startupTypeMap: Record<string, string> = {
        auto: 'Automatic',
        automatic: 'Automatic',
        manual: 'Manual',
        disabled: 'Disabled'
      }
      const startupType = startupTypeMap[previousValue.startMode.toLowerCase()] ?? 'Manual'
      const startStop = previousValue.wasRunning
        ? `try { Start-Service -Name '${name}' -ErrorAction Stop } catch {}`
        : `try { Stop-Service -Name '${name}' -Force -ErrorAction Stop } catch {}`
      script = `
Set-Service -Name '${name}' -StartupType ${startupType} -ErrorAction Stop
${startStop}
exit 0`
    } else if (operation.type === 'powerPlan' && previousValue.kind === 'powerPlan') {
      if (!previousValue.activeGuid) {
        return { success: false, error: 'No previous power plan GUID was captured.' }
      }
      script = `powercfg -setactive ${previousValue.activeGuid}`
    } else if (operation.type === 'networkDns' && previousValue.kind === 'networkDns') {
      script = buildDnsWriteScript(previousValue.interfaceIndex, previousValue.ipv4.staticServers, {
        touch: previousValue.ipv6.enabled,
        servers: previousValue.ipv6.staticServers
      })
    } else {
      return { success: false, error: `No revert handler for operation type "${operation.type}".` }
    }

    await runPowerShell(script)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
