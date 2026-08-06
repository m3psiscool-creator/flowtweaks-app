import { useEffect, useMemo } from 'react'
import type { StartupItem, StartupScope } from '@shared/ipc-types'
import { useStartup } from '@renderer/hooks/useStartup'
import ToggleSwitch from '@renderer/components/ToggleSwitch'
import Pill from '@renderer/components/Pill'
import { IconRocket } from '@renderer/components/icons'

const SCOPE_LABELS: Record<StartupScope, string> = {
  user: 'Your Account',
  allUsers: 'All Users'
}

function StartupItemRow({
  item,
  busy,
  disabled,
  onToggle
}: {
  item: StartupItem
  busy: boolean
  disabled: boolean
  onToggle: (enabled: boolean) => void
}): React.JSX.Element {
  return (
    <div className="ft-glass ft-hoverable-subtle flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-white">{item.name}</h3>
          <Pill
            label={item.source === 'registry' ? 'Registry' : 'Startup Folder'}
            className="bg-white/10 text-white/50"
          />
          {item.needsElevation && <Pill label="Needs Admin" className="bg-status-warning/15 text-status-warning" />}
        </div>
        <p className="mt-1 truncate font-mono text-xs text-white/40" title={item.command}>
          {item.command || '(no command path found)'}
        </p>
      </div>
      <ToggleSwitch
        state={item.enabled ? 'on' : 'off'}
        busy={busy}
        disabled={disabled}
        ariaLabel={`Turn ${item.name} ${item.enabled ? 'off' : 'on'} at startup`}
        onClick={() => onToggle(!item.enabled)}
      />
    </div>
  )
}

export default function StartupPrograms(): React.JSX.Element {
  const { report, loading, error, refresh, togglingId, toggleError, setEnabled } = useStartup()

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const groups = useMemo(() => {
    if (!report) return []
    const order: StartupScope[] = ['user', 'allUsers']
    return order
      .map((scope) => ({ scope, items: report.items.filter((i) => i.scope === scope) }))
      .filter((g) => g.items.length > 0)
  }, [report])

  const anyBusy = togglingId !== null

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
          <IconRocket className="h-8 w-8" /> Startup Programs
        </h1>
        {report && (
          <button
            type="button"
            onClick={refresh}
            disabled={loading || anyBusy}
            className="text-sm text-white/40 underline hover:text-white/70 disabled:opacity-40"
          >
            Rescan
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-white/40">
        Everything Windows launches automatically when you sign in. Turning one off here uses the
        same mechanism Task Manager&apos;s own Startup tab does — reversible, nothing is deleted.
      </p>

      {report && !report.isElevated && report.items.some((i) => i.needsElevation) && (
        <p className="ft-glass mt-4 border-status-warning/30 p-3 text-sm text-status-warning">
          Not running as administrator — startup programs shared by every account on this PC (marked
          &quot;Needs Admin&quot;) can be seen but not changed until Flow Tweaks is relaunched
          elevated.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-status-critical">{error}</p>}
      {toggleError && <p className="mt-4 text-sm text-status-critical">{toggleError}</p>}

      {!report && loading && <p className="mt-16 text-center text-sm text-white/40">Reading startup programs…</p>}

      {report && report.items.length === 0 && !loading && (
        <p className="mt-16 text-center text-sm text-white/40">No startup programs found on this PC.</p>
      )}

      <div className="mt-6 flex flex-col gap-8">
        {groups.map(({ scope, items }) => (
          <section key={scope}>
            <h2 className="ft-heading mb-3 text-xl text-white/80">{SCOPE_LABELS[scope]}</h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <StartupItemRow
                  key={item.id}
                  item={item}
                  busy={togglingId === item.id}
                  disabled={item.needsElevation || (anyBusy && togglingId !== item.id)}
                  onToggle={(enabled) => setEnabled(item, enabled)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
