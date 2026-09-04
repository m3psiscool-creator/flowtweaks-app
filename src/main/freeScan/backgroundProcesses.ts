import si from 'systeminformation'
import { NON_ESSENTIAL_PROCESSES } from '../../../data/nonEssentialProcesses'
import type { BackgroundProcessesSnapshot, NonEssentialProcessMatch } from '../../shared/ipc-types'

function stripExe(name: string): string {
  return name.replace(/\.exe$/i, '')
}

export async function getBackgroundProcessesSnapshot(): Promise<BackgroundProcessesSnapshot> {
  const data = await si.processes().catch(() => null)
  if (!data) {
    return { totalProcessCount: 0, totalCpuPercent: 0, totalMemoryBytes: 0, nonEssential: [] }
  }

  const totalCpuPercent = data.list.reduce((sum, p) => sum + (p.cpu ?? 0), 0)
  const totalMemoryBytes = data.list.reduce((sum, p) => sum + (p.memRss ?? 0) * 1024, 0)

  const seen = new Set<string>()
  const nonEssential: NonEssentialProcessMatch[] = []
  for (const proc of data.list) {
    const bare = stripExe(proc.name).toLowerCase()
    if (seen.has(bare)) continue
    const match = NON_ESSENTIAL_PROCESSES.find((def) => def.processName.toLowerCase() === bare)
    if (!match) continue
    seen.add(bare)
    nonEssential.push({ processName: proc.name, label: match.label, reason: match.reason })
  }

  return {
    totalProcessCount: data.all,
    totalCpuPercent: Math.round(totalCpuPercent * 10) / 10,
    totalMemoryBytes,
    nonEssential
  }
}
