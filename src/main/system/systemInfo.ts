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

// Only the DMTF SMBIOS chassis types that are unambiguously mains-powered desktop enclosures.
// Deliberately excludes "All in One" and "Docking Station" too — some AIOs ship a battery backup
// for graceful shutdown, and a docked device is still fundamentally a laptop. Battery presence
// alone was considered and rejected for this check: a desktop with a UPS attached can report a
// battery over ACPI, and some handhelds don't report one reliably either — chassis type is the
// more direct signal for "can this machine safely lose Fast Startup/hibernation."
const DESKTOP_CHASSIS_TYPES = new Set([
  'Desktop',
  'Low Profile Desktop',
  'Pizza Box',
  'Mini Tower',
  'Tower',
  'Space-Saving',
  'Lunch Box',
  'Main System Chassis',
  'Rack Mount Chassis',
  'Sealed-Case PC',
  'Mini PC',
  'Stick PC'
])

function classifyChassisType(rawType: string): SystemSpecs['chassisType'] {
  if (DESKTOP_CHASSIS_TYPES.has(rawType)) return 'desktop'
  if (!rawType || rawType === 'Other' || rawType === 'Unknown') return 'unknown'
  return 'portable'
}

export async function getSystemSpecs(): Promise<SystemSpecs> {
  const [osInfo, cpu, graphics, mem, fsSize, chassis] = await Promise.all([
    si.osInfo(),
    si.cpu(),
    si.graphics(),
    si.mem(),
    si.fsSize(),
    si.chassis()
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
    chassisType: classifyChassisType(chassis.type),
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
