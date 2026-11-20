import { useEffect, useState } from 'react'
import { useSystemInfo } from '@renderer/hooks/useSystemInfo'
import Gauge from '@renderer/components/Gauge'
import { formatBytesToGB } from '@renderer/lib/format'
import { useAccount } from '@renderer/hooks/useAccount'
import { useAppNavigation } from '@renderer/context/AppNavigation'
import TrialClock from '@renderer/components/TrialClock'
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

// The one obvious thing to do in the app. What it says and where it goes depends on the account:
//  - signed out        → "create your free account" (Account tab; finishing sign-up carries on to
//                        the free trial and Optimizations automatically — see App.tsx)
//  - signed in, no trial used → starts the free 3-day trial, then opens Optimizations
//  - unlocked (paid / trial / staff) → opens Optimizations
//  - trial over, not bought → Billing
function StartTweaksCard(): React.JSX.Element {
  const {
    session,
    hasLicense,
    trial,
    loading,
    loadingTickets,
    ticketsError,
    busy,
    error,
    startTrial,
    setStartRequested,
    refreshTickets
  } = useAccount()
  const navigate = useAppNavigation()

  const isStaff = session?.user.role === 'staff'
  const checking = loading || (!!session && loadingTickets)
  const unlocked = isStaff || (!!session && hasLicense)
  const canStartTrial = !!session && !unlocked && trial?.state === 'none' && !trial.hasPaid
  const trialEnded = !!session && !unlocked && trial?.state === 'expired' && !trial.hasPaid
  const onTrial = !!session && trial?.state === 'active' && !trial.hasPaid

  let label = 'Start Tweaks'
  let hint = 'Create a free account to begin. Your 3-day free trial starts as soon as you do.'
  let action: () => void = () => {
    setStartRequested(true)
    navigate('account')
  }

  if (checking) {
    label = 'Checking your account…'
    hint = ''
  } else if (session && ticketsError && !unlocked) {
    label = 'Retry'
    hint = "Couldn't reach the server to check your account. This doesn't mean you're locked out."
    action = refreshTickets
  } else if (unlocked) {
    hint = isStaff ? 'Staff account.' : "You're unlocked. Scan this PC and apply your tweaks."
    action = () => navigate('optimizations')
  } else if (canStartTrial) {
    label = 'Start Tweaks'
    hint = 'Starts your free 3-day trial — every PC tweak unlocked, no card needed.'
    action = () => {
      startTrial().then((ok) => navigate(ok ? 'optimizations' : 'billing'))
    }
  } else if (trialEnded) {
    label = 'Unlock to Continue'
    hint = 'Your free trial has ended and your PC was put back to normal. Buy the PC plan to unlock the tweaks again.'
    action = () => navigate('billing')
  } else if (session) {
    label = 'Unlock Tweaks'
    hint = 'Head to Billing to unlock the PC tweaks.'
    action = () => navigate('billing')
  }

  return (
    <section className="ft-glass mt-6 flex flex-col items-center gap-4 border-ft-orange/50 bg-ft-orange/[0.06] p-8 text-center">
      {onTrial && trial && (
        <p className="text-sm text-white/70">
          Free trial ends in{' '}
          <strong className="text-ft-orange">
            <TrialClock remainingMs={trial.remainingMs} />
          </strong>
        </p>
      )}
      <button
        type="button"
        onClick={action}
        disabled={checking || busy}
        className="ft-heading ft-btn-glow w-full max-w-md rounded bg-ft-orange px-8 py-5 text-2xl tracking-widest text-ft-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Working…' : label}
      </button>
      {hint && <p className="max-w-md text-sm text-white/60">{hint}</p>}
      {error && <p className="text-sm text-status-critical">{error}</p>}
    </section>
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

      <StartTweaksCard />

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
