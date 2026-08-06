import { useEffect, useState } from 'react'
import { useSystemInfo } from '@renderer/hooks/useSystemInfo'
import Gauge from '@renderer/components/Gauge'
import { formatBytesToGB } from '@renderer/lib/format'
import type { RestoreSession } from '@shared/ipc-types'
import {
  IconComputer,
  IconWindows,
  IconCpu,
  IconGpu,
  IconMemory,
  IconStorage,
  IconClock,
  IconCheckCircle
} from '@renderer/components/icons'

function SpecRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: string
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm last:border-0">
      <span className="flex items-center gap-2 text-white/50">
        <span className="text-ft-orange/70">{icon}</span>
        {label}
      </span>
      <span className="text-right text-white">{value}</span>
    </div>
  )
}

export default function Home(): React.JSX.Element {
  const { specs, usage, error } = useSystemInfo()
  const [sessions, setSessions] = useState<RestoreSession[] | null>(null)

  useEffect(() => {
    window.api.restore.getSessions().then(setSessions)
  }, [])

  const totalApplied = sessions?.reduce(
    (sum, s) => sum + s.entries.filter((e) => e.outcome === 'applied').length,
    0
  )
  const lastRun = sessions?.[0]?.createdAt

  return (
    <div>
      <h1 className="text-4xl text-ft-orange">Home</h1>

      {error && <p className="mt-4 text-sm text-status-critical">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="ft-glass p-5 lg:col-span-2">
          <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
            <IconComputer className="h-5 w-5" /> This PC
          </h2>
          {specs ? (
            <div className="mt-3">
              <SpecRow icon={<IconComputer className="h-4 w-4" />} label="Computer name" value={specs.computerName} />
              <SpecRow
                icon={<IconWindows className="h-4 w-4" />}
                label="Windows version"
                value={`${specs.windowsVersion} (build ${specs.windowsBuild})`}
              />
              <SpecRow icon={<IconCpu className="h-4 w-4" />} label="CPU" value={specs.cpuModel} />
              <SpecRow
                icon={<IconCpu className="h-4 w-4" />}
                label="Cores / Threads"
                value={`${specs.cpuCores} / ${specs.cpuThreads}`}
              />
              <SpecRow icon={<IconGpu className="h-4 w-4" />} label="GPU" value={specs.gpuModel} />
              <SpecRow icon={<IconMemory className="h-4 w-4" />} label="RAM" value={formatBytesToGB(specs.ramTotalBytes)} />
              {specs.disks.map((disk) => (
                <SpecRow
                  key={disk.mount}
                  icon={<IconStorage className="h-4 w-4" />}
                  label={`Storage (${disk.mount})`}
                  value={`${formatBytesToGB(disk.usedBytes)} / ${formatBytesToGB(disk.totalBytes)} used`}
                />
              ))}
            </div>
          ) : (
            !error && <p className="mt-3 text-sm text-white/40">Reading system specs…</p>
          )}
        </section>

        <section className="ft-glass p-5">
          <h2 className="ft-heading text-xl text-white/80">Live Usage</h2>
          {usage ? (
            <div className="mt-4 flex flex-col items-center gap-6">
              <Gauge label="CPU" value={usage.cpuLoadPercent} />
              <Gauge
                label="Memory"
                value={(usage.ramUsedBytes / usage.ramTotalBytes) * 100}
                detail={`${formatBytesToGB(usage.ramUsedBytes)} / ${formatBytesToGB(usage.ramTotalBytes)}`}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/40">Reading live usage…</p>
          )}
        </section>

        <section className="ft-glass p-5 lg:col-span-3">
          <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
            <IconClock className="h-5 w-5" /> Optimization Status
          </h2>
          {sessions === null ? (
            <p className="mt-3 text-sm text-white/40">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">
              Nothing applied yet. Head to Optimizations to scan this PC and apply your first tweak.
            </p>
          ) : (
            <div className="mt-3 flex items-center gap-3 text-sm">
              <IconCheckCircle className="h-5 w-5 shrink-0 text-status-good" />
              <p className="text-white/70">
                <span className="text-status-good">{totalApplied}</span> tweak{totalApplied === 1 ? '' : 's'}{' '}
                applied across {sessions.length} session{sessions.length === 1 ? '' : 's'} — last run{' '}
                {lastRun ? new Date(lastRun).toLocaleString() : '—'}.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
