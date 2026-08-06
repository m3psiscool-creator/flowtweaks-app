import { getTweakById } from '@data/tweaks'
import type { ChangeLogEntry, RestoreSession } from '@shared/ipc-types'
import { useRestore } from '@renderer/hooks/useRestore'
import { IconClock, IconCheckCircle, IconXCircle } from '@renderer/components/icons'

function groupByTweak(entries: ChangeLogEntry[]): Array<{ tweakId: string; entries: ChangeLogEntry[] }> {
  const order: string[] = []
  const map = new Map<string, ChangeLogEntry[]>()
  for (const entry of entries) {
    if (!map.has(entry.tweakId)) {
      map.set(entry.tweakId, [])
      order.push(entry.tweakId)
    }
    map.get(entry.tweakId)!.push(entry)
  }
  return order.map((tweakId) => ({ tweakId, entries: map.get(tweakId)! }))
}

export default function Restore(): React.JSX.Element {
  const {
    restorePoints,
    sessions,
    loading,
    creating,
    createResult,
    createPoint,
    revertingIds,
    revertErrors,
    revertSession,
    revertTweak
  } = useRestore()

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-ft-orange">Restore &amp; History</h1>
        <button
          type="button"
          onClick={createPoint}
          disabled={creating}
          className="ft-heading ft-btn-glow rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {creating ? 'Creating…' : 'Create Restore Point'}
        </button>
      </div>

      {createResult && (
        <p className={`mt-4 flex items-center gap-2 text-sm ${createResult.success ? 'text-status-good' : 'text-status-critical'}`}>
          {createResult.success ? <IconCheckCircle className="h-4 w-4" /> : <IconXCircle className="h-4 w-4" />}
          {createResult.success
            ? 'Restore point created (or Windows reused a recent one — that\'s normal).'
            : createResult.error}
        </p>
      )}

      <section className="ft-glass mt-6 p-5">
        <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
          <IconClock className="h-5 w-5" /> Windows Restore Points
        </h2>
        <p className="mt-1 text-sm text-white/40">
          The system-level safety net. Flow Tweaks creates one of these before every optimization
          run, in addition to its own change log below.
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-white/40">Loading…</p>
        ) : restorePoints.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">
            No restore points found, or System Restore is turned off for this drive.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-1">
            {restorePoints.slice(0, 8).map((point) => (
              <div
                key={point.sequenceNumber}
                className="flex justify-between border-b border-white/5 py-1.5 text-sm"
              >
                <span className="text-white/70">{point.description}</span>
                <span className="text-white/40">{new Date(point.creationTime).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ft-glass mt-6 p-5">
        <h2 className="ft-heading text-xl text-white/80">Change Log</h2>
        <p className="mt-1 text-sm text-white/40">
          Every tweak Flow Tweaks applies is recorded here with its previous value, so it can be
          reverted individually or all at once.
        </p>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">No changes applied yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                revertingIds={revertingIds}
                revertErrors={revertErrors}
                onRevertSession={() => revertSession(session.id)}
                onRevertTweak={(tweakId) => revertTweak(session.id, tweakId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SessionCard({
  session,
  revertingIds,
  revertErrors,
  onRevertSession,
  onRevertTweak
}: {
  session: RestoreSession
  revertingIds: Set<string>
  revertErrors: Record<string, string>
  onRevertSession: () => void
  onRevertTweak: (tweakId: string) => void
}): React.JSX.Element {
  const groups = groupByTweak(session.entries)
  const hasRevertable = session.entries.some((e) => e.outcome === 'applied')
  const sessionReverting = revertingIds.has(session.id)

  return (
    <div className="ft-glass-solid p-3 text-sm">
      <div className="flex items-center justify-between text-white/70">
        <span>{session.description}</span>
        <div className="flex items-center gap-3">
          <span className="text-white/40">{new Date(session.createdAt).toLocaleString()}</span>
          {hasRevertable && (
            <button
              type="button"
              onClick={onRevertSession}
              disabled={sessionReverting}
              className="rounded border border-ft-orange/50 px-2 py-1 text-xs text-ft-orange hover:bg-ft-orange/10 disabled:opacity-40"
            >
              {sessionReverting ? 'Reverting…' : 'Revert All'}
            </button>
          )}
        </div>
      </div>
      {revertErrors[session.id] && <p className="mt-1 text-xs text-status-critical">{revertErrors[session.id]}</p>}

      {groups.length === 0 ? (
        <p className="mt-1 text-white/40">No changes in this session.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5">
          {groups.map(({ tweakId, entries }) => {
            const key = `${session.id}:${tweakId}`
            const reverting = revertingIds.has(key)
            const outcome = entries.every((e) => e.outcome === 'reverted')
              ? 'reverted'
              : entries.some((e) => e.outcome === 'revert-failed')
                ? 'revert-failed'
                : entries.some((e) => e.outcome === 'applied')
                  ? 'applied'
                  : entries[0].outcome
            const canRevert = outcome === 'applied'

            return (
              <div key={tweakId} className="flex items-center justify-between text-xs">
                <span className="text-white/60">
                  {getTweakById(tweakId)?.name ?? tweakId}{' '}
                  <span
                    className={
                      outcome === 'reverted'
                        ? 'text-status-good'
                        : outcome === 'revert-failed'
                          ? 'text-status-critical'
                          : 'text-white/40'
                    }
                  >
                    ({outcome})
                  </span>
                </span>
                {canRevert && (
                  <button
                    type="button"
                    onClick={() => onRevertTweak(tweakId)}
                    disabled={reverting}
                    className="text-white/40 underline hover:text-white/70 disabled:opacity-40"
                  >
                    {reverting ? 'Reverting…' : 'Revert'}
                  </button>
                )}
                {revertErrors[key] && <span className="text-status-critical">{revertErrors[key]}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
