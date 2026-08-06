import { useEffect, useState } from 'react'
import { BOOST_GAMES } from '@data/boostGames'
import { useBoost } from '@renderer/hooks/useBoost'

const PHASE_LABELS: Record<string, string> = {
  idle: 'Off',
  watching: 'Watching',
  boosted: 'Boosted'
}

export default function BoostMode(): React.JSX.Element {
  const { status, starting, stopping, runningProcesses, loadingProcesses, refreshRunningProcesses, start, stop } =
    useBoost()
  const [gameId, setGameId] = useState(BOOST_GAMES[0].id)
  const [pauseSelected, setPauseSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    refreshRunningProcesses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function togglePause(name: string): void {
    setPauseSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const enabled = status?.enabled ?? false
  const phase = status?.phase ?? 'idle'

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl text-ft-orange">Boost Mode</h1>
      <p className="mt-2 text-white/60">
        Pick a game and, optionally, background programs to pause while it&apos;s running. Flow
        Tweaks applies a couple of instant, fully-reversible tweaks the moment the game launches
        and puts everything back exactly as it was the moment it closes. The full dashboard
        doesn&apos;t need to stay open — this keeps working in the background.
      </p>

      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="ft-heading text-xl text-white/80">Status</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              phase === 'boosted'
                ? 'bg-ft-orange/15 text-ft-orange'
                : phase === 'watching'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-white/10 text-white/50'
            }`}
          >
            {PHASE_LABELS[phase]}
          </span>
        </div>
        {status?.gameName && (
          <p className="mt-2 text-sm text-white/60">
            {phase === 'boosted'
              ? `${status.gameName} detected (${status.detectedProcess}) — boosted since ${
                  status.boostedSince ? new Date(status.boostedSince).toLocaleTimeString() : '—'
                }`
              : `Watching for ${status.gameName}…`}
          </p>
        )}
        {status?.lastError && <p className="mt-2 text-sm text-red-400">{status.lastError}</p>}
      </div>

      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5">
        <h2 className="ft-heading text-xl text-white/80">Game</h2>
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          disabled={enabled}
          className="mt-3 w-full rounded border border-white/10 bg-ft-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {BOOST_GAMES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <h3 className="mt-5 font-semibold text-white/80">Pause while playing (optional)</h3>
        <p className="mt-1 text-xs text-white/40">
          Lowers these programs&apos; CPU priority while boosted, restored the instant the game
          closes. Only apps with a visible window are listed.
        </p>
        {loadingProcesses ? (
          <p className="mt-3 text-sm text-white/40">Loading running programs…</p>
        ) : runningProcesses.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">No eligible running programs found.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {runningProcesses.map((name) => (
              <label key={name} className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={pauseSelected.has(name)}
                  onChange={() => togglePause(name)}
                  disabled={enabled}
                  className="accent-ft-orange"
                />
                {name}
              </label>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          {!enabled ? (
            <button
              type="button"
              onClick={() => start({ gameId, pauseProcessNames: [...pauseSelected] })}
              disabled={starting}
              className="ft-heading ft-btn-glow rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {starting ? 'Starting…' : 'Enable Boost Mode'}
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              disabled={stopping}
              className="ft-heading rounded border border-ft-orange px-5 py-2 text-lg tracking-wide text-ft-orange transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {stopping ? 'Stopping…' : 'Disable Boost Mode'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
