import { useEffect, useMemo } from 'react'
import { GAME_PROFILES, type GameProfile } from '@data/gameProfiles'
import type { TweakDefinition } from '@data/schema'
import { getTweakById } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS, CHECKOUT_URL } from '@data/applyEnabled'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import { useWheel } from '@renderer/hooks/useWheel'
import ResultsReport from '@renderer/components/ResultsReport'

function ProfileCard({
  profile,
  unlockedTweakIds,
  onApply,
  applying
}: {
  profile: GameProfile
  unlockedTweakIds: Set<string>
  onApply: (tweakIds: string[]) => void
  applying: boolean
}): React.JSX.Element {
  const bundleTweaks = profile.tweakIds
    .map((id) => getTweakById(id))
    .filter((t): t is TweakDefinition => t !== undefined)
  const applyableIds = profile.tweakIds.filter((id) => APPLY_ENABLED_TWEAK_IDS.has(id) && unlockedTweakIds.has(id))
  const anyUnlocked = applyableIds.length > 0

  return (
    <div className="ft-hoverable rounded-lg border border-white/10 bg-white/5 p-5">
      <h3 className="ft-heading text-xl text-white">{profile.name}</h3>
      <p className="mt-1 text-sm text-white/50">{profile.description}</p>

      <div className="mt-4 flex flex-col gap-1.5">
        {bundleTweaks.map((tweak) => {
          const unlocked = unlockedTweakIds.has(tweak.id)
          return (
            <div key={tweak.id} className="flex items-center justify-between text-xs">
              <span className={unlocked ? 'text-white/70' : 'text-white/30'}>{tweak.name}</span>
              {!unlocked && <span className="text-white/25">Locked</span>}
            </div>
          )
        })}
      </div>

      {anyUnlocked ? (
        <button
          type="button"
          onClick={() => onApply(applyableIds)}
          disabled={applying}
          className="ft-heading ft-btn-glow mt-4 w-full rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {applying ? 'Applying…' : `Apply Profile (${applyableIds.length})`}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => window.open(CHECKOUT_URL, '_blank')}
          className="ft-heading mt-4 w-full rounded border border-ft-orange px-4 py-2 text-sm tracking-wide text-ft-orange transition-opacity hover:opacity-90"
        >
          Unlock Full Package — $11.99
        </button>
      )}
    </div>
  )
}

export default function GameProfiles(): React.JSX.Element {
  const { runScan } = useScan()
  const { applying, result, apply, reset } = useApply()
  const { state: wheelState } = useWheel()

  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unlockedTweakIds = useMemo(
    () => new Set(wheelState?.unlockedTweakId ? [wheelState.unlockedTweakId] : []),
    [wheelState]
  )

  async function handleApply(tweakIds: string[]): Promise<void> {
    await apply(tweakIds)
    runScan()
  }

  return (
    <div>
      <h1 className="text-4xl text-ft-orange">Game Profiles</h1>
      <p className="mt-2 text-white/60">
        Apply a bundle of compatible tweaks tuned for what you&apos;re playing, in one click.
      </p>

      {result && (
        <div className="mt-4">
          {result.restorePointCreated ? (
            <ResultsReport results={result.results} />
          ) : (
            <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              Nothing was applied — couldn&apos;t create a restore point first. {result.restorePointError}
            </p>
          )}
          <button type="button" onClick={reset} className="mt-2 text-xs text-white/40 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GAME_PROFILES.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            unlockedTweakIds={unlockedTweakIds}
            onApply={handleApply}
            applying={applying}
          />
        ))}
      </div>
    </div>
  )
}
