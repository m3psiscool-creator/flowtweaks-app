import { useEffect, useMemo } from 'react'
import { getTweakById } from '@data/tweaks'
import { useDiagnostics } from '@renderer/hooks/useDiagnostics'

const DISCORD_URL = 'https://discord.gg/R5hEsssQgd'

export default function Diagnostics(): React.JSX.Element {
  const {
    report,
    loading,
    refresh,
    exporting,
    exportResult,
    exportReport,
    generating,
    supportCode,
    generateSupportCode,
    restoringDefaults,
    restoreDefaultsResult,
    restoreDefaults
  } = useDiagnostics()

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const failedEntries = useMemo(() => {
    if (!report) return []
    return report.sessions.flatMap((session) =>
      session.entries
        .filter((e) => e.outcome === 'failed' || e.outcome === 'revert-failed')
        .map((entry) => ({ session, entry }))
    )
  }, [report])

  const lastOptimizationDate = report?.sessions[0]?.createdAt ?? null
  const totalApplied = useMemo(
    () =>
      report?.sessions.reduce(
        (sum, s) => sum + s.entries.filter((e) => e.outcome === 'applied').length,
        0
      ) ?? 0,
    [report]
  )

  return (
    <div>
      <h1 className="text-4xl text-ft-orange">Diagnostics</h1>
      <p className="mt-2 text-white/60">
        Everything here reflects what&apos;s actually on this PC — nothing simulated.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">Optimization History</h2>
          {loading ? (
            <p className="mt-3 text-sm text-white/40">Loading…</p>
          ) : !report || report.sessions.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No optimizations applied yet.</p>
          ) : (
            <div className="mt-3 text-sm">
              <p className="text-white/70">{totalApplied} change(s) applied across {report.sessions.length} session(s)</p>
              <p className="mt-1 text-white/40">
                Last run: {lastOptimizationDate ? new Date(lastOptimizationDate).toLocaleString() : '—'}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">Failed Changes</h2>
          {loading ? (
            <p className="mt-3 text-sm text-white/40">Loading…</p>
          ) : failedEntries.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">None — everything that ran, applied cleanly.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {failedEntries.map(({ session, entry }) => (
                <div key={entry.id} className="border-b border-white/5 pb-2 text-red-400">
                  <span className="text-white/70">{getTweakById(entry.tweakId)?.name ?? entry.tweakId}</span>{' '}
                  — {entry.outcome}
                  {entry.errorMessage && <p className="mt-0.5 text-xs text-red-400/70">{entry.errorMessage}</p>}
                  <p className="text-xs text-white/30">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">Export Diagnostic Report</h2>
          <p className="mt-1 text-sm text-white/40">
            Saves specs, current scan state, and full change history to a file you choose.
          </p>
          <button
            type="button"
            onClick={exportReport}
            disabled={exporting}
            className="ft-heading mt-3 rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {exporting ? 'Exporting…' : 'Export Report'}
          </button>
          {exportResult && (
            <p className="mt-2 text-xs text-white/50">
              {exportResult.filePath ? `Saved to ${exportResult.filePath}` : 'Export cancelled.'}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">Support Code</h2>
          <p className="mt-1 text-sm text-white/40">
            Generates a code tied to a saved diagnostic snapshot. Give the code and the file to
            support on Discord and we can see exactly what happened.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generateSupportCode}
              disabled={generating}
              className="ft-heading rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {generating ? 'Generating…' : 'Generate Support Code'}
            </button>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-ft-orange underline hover:opacity-80"
            >
              Open a Discord Support Ticket
            </a>
          </div>
          {supportCode && (
            <div className="mt-3 rounded border border-ft-orange/30 bg-ft-orange/10 p-3 text-sm">
              <p className="ft-heading text-lg tracking-widest text-ft-orange">{supportCode.code}</p>
              <p className="mt-1 text-xs text-white/50">
                Saved to {supportCode.filePath} — attach this file when you open your ticket.
              </p>
              <button
                type="button"
                onClick={() => window.api.diagnostics.revealFile(supportCode.filePath)}
                className="mt-2 text-xs text-white/40 underline hover:text-white/70"
              >
                Show file in folder
              </button>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-red-500/20 bg-red-500/5 p-5 lg:col-span-2">
          <h2 className="ft-heading text-xl text-red-400">Restore Default Windows Settings</h2>
          <p className="mt-1 text-sm text-white/50">
            Reverts every applied change across every session back to its exact previous value —
            same underlying mechanism as Restore, applied to everything at once. This does not
            touch tweaks that already failed to apply or were already reverted.
          </p>
          <button
            type="button"
            onClick={restoreDefaults}
            disabled={restoringDefaults}
            className="ft-heading mt-3 rounded border border-red-500/50 px-4 py-2 text-sm tracking-wide text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
          >
            {restoringDefaults ? 'Restoring…' : 'Restore Defaults'}
          </button>
          {restoreDefaultsResult && (
            <p className={`mt-2 text-sm ${restoreDefaultsResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {restoreDefaultsResult.success
                ? 'All applied changes reverted.'
                : restoreDefaultsResult.error}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
