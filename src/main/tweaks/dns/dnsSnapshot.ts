import type { DnsAdapterInfo, NetworkDnsSnapshotValue } from '../../../shared/ipc-types'
import { readDnsConfig } from './readDnsConfig'

export async function captureDnsSnapshot(adapter: DnsAdapterInfo): Promise<NetworkDnsSnapshotValue | null> {
  const config = await readDnsConfig(adapter)
  if (!config) return null
  return {
    kind: 'networkDns',
    interfaceIndex: adapter.interfaceIndex,
    interfaceAlias: adapter.interfaceAlias,
    ipv4: config.ipv4,
    ipv6: config.ipv6
  }
}
