import si from 'systeminformation'
import os from 'os'
import type { GpuVendor, SystemSpecs, SystemUsage } from '../../shared/ipc-types'

function detectGpuVendors(vendorStrings: string[]): GpuVendor[] {
  const vendors = new Set<GpuVendor>()
  for (const raw of vendorStrings) {
    const v = raw.toLowerCase()
    if (v.includes('nvidia')) vendors.add('nvidia')
    else if (v.includes('amd') || v.includes('advanced micro')) vendors.add('amd')
    else if (v.includes('intel')) vendors.add('intel')
  }
  return [...vendors]
}

export async function getSystemSpecs(): Promise<SystemSpecs> {
  const [osInfo, cpu, graphics, mem, fsSize] = await Promise.all([
    si.osInfo(),
    si.cpu(),
    si.graphics(),
    si.mem(),
    si.fsSize()
  ])

  const gpuModel =
    graphics.controllers
      .map((c) => c.model)
      .filter((model): model is string => Boolean(model))
      .join(', ') || 'Unknown GPU'

  const gpuVendors = detectGpuVendors(
    graphics.controllers.map((c) => c.vendor).filter((v): v is string => Boolean(v))
  )

  return {
    computerName: os.hostname(),
    windowsVersion: osInfo.distro || osInfo.platform,
    windowsBuild: osInfo.build || osInfo.release,
    cpuModel: cpu.brand || `${cpu.manufacturer} ${cpu.family}`.trim(),
    cpuCores: cpu.physicalCores,
    cpuThreads: cpu.cores,
    gpuModel,
    gpuVendors,
    ramTotalBytes: mem.total,
    disks: fsSize
      .filter((d) => d.mount && d.size > 0)
      .map((d) => ({
        mount: d.mount,
        totalBytes: d.size,
        usedBytes: d.used
      }))
  }
}

export async function getSystemUsage(): Promise<SystemUsage> {
  const [load, mem] = await Promise.all([si.currentLoad(), si.mem()])

  return {
    cpuLoadPercent: load.currentLoad,
    ramUsedBytes: mem.active,
    ramTotalBytes: mem.total
  }
}
