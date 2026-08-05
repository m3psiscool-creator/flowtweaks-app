import { useSystemInfo } from '@renderer/hooks/useSystemInfo'
import UsageBar from '@renderer/components/UsageBar'
import { formatBytesToGB } from '@renderer/lib/format'

function SpecRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex justify-between border-b border-white/5 py-2 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  )
}

export default function Home(): React.JSX.Element {
  const { specs, usage, error } = useSystemInfo()

  return (
    <div>
      <h1 className="text-4xl text-ft-orange">Home</h1>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">This PC</h2>
          {specs ? (
            <div className="mt-3">
              <SpecRow label="Computer name" value={specs.computerName} />
              <SpecRow
                label="Windows version"
                value={`${specs.windowsVersion} (build ${specs.windowsBuild})`}
              />
              <SpecRow label="CPU" value={specs.cpuModel} />
              <SpecRow label="Cores / Threads" value={`${specs.cpuCores} / ${specs.cpuThreads}`} />
              <SpecRow label="GPU" value={specs.gpuModel} />
              <SpecRow label="RAM" value={formatBytesToGB(specs.ramTotalBytes)} />
              {specs.disks.map((disk) => (
                <SpecRow
                  key={disk.mount}
                  label={`Storage (${disk.mount})`}
                  value={`${formatBytesToGB(disk.usedBytes)} / ${formatBytesToGB(disk.totalBytes)} used`}
                />
              ))}
            </div>
          ) : (
            !error && <p className="mt-3 text-sm text-white/40">Reading system specs…</p>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">Live Usage</h2>
          {usage ? (
            <div className="mt-4 flex flex-col gap-5">
              <UsageBar label="CPU" percent={usage.cpuLoadPercent} />
              <UsageBar
                label="Memory"
                percent={(usage.ramUsedBytes / usage.ramTotalBytes) * 100}
                detail={`${formatBytesToGB(usage.ramUsedBytes)} / ${formatBytesToGB(usage.ramTotalBytes)}`}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/40">Reading live usage…</p>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5 lg:col-span-2">
          <h2 className="ft-heading text-xl text-white/80">Optimization Status</h2>
          <p className="mt-3 text-sm text-white/40">
            No optimizations applied yet. Restore &amp; History (Phase 5) and the Optimizations
            flow (Phase 6) aren&apos;t built yet, so there&apos;s nothing real to show here.
          </p>
        </section>
      </div>
    </div>
  )
}
