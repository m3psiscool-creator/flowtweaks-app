import { useEffect } from 'react'
import { GAME_PROFILES, type GameProfile } from '@data/gameProfiles'
import { CATEGORY_COLORS, type TweakDefinition } from '@data/schema'
import { getTweakById } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS } from '@data/applyEnabled'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import ResultsReport from '@renderer/components/ResultsReport'
import { IconGamepad } from '@renderer/components/icons'

function ProfileCard({
  profile,
  onApply,
  applying
}: {
  profile: GameProfile
  onApply: (tweakIds: string[]) => void
  applying: boolean
}): React.JSX.Element {
  const bundleTweaks = profile.tweakIds
    .map((id) => getTweakById(id))
    .filter((t): t is TweakDefinition => t !== undefined)
  const applyableIds = profile.tweakIds.filter((id) => APPLY_ENABLED_TWEAK_IDS.has(id))

  return (
    <div className="ft-glass ft-glass-hover p-5">
      <div className="flex items-center gap-2.5">
        <IconGamepad className="h-5 w-5 text-ft-orange" />
        <h3 className="ft-heading text-xl text-white">{profile.name}</h3>
      </div>
      <p className="mt-1 text-sm text-white/50">{profile.description}</p>

      <div className="mt-4 flex flex-col gap-1.5">
        {bundleTweaks.map((tweak) => (
          <div key={tweak.id} className="flex items-center gap-2 text-xs text-white/70">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[tweak.category] }} />
            {tweak.name}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onApply(applyableIds)}
        disabled={applying || applyableIds.length === 0}
        className="ft-heading ft-btn-glow mt-4 w-full rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {applying ? 'Applying…' : `Apply Profile (${applyableIds.length})`}
      </button>
    </div>
  )
}

export default function GameProfiles(): React.JSX.Element {
  const { runScan } = useScan()
  const { applying, result, apply, reset } = useApply()

  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            <p className="rounded-xl border border-status-critical/30 bg-status-critical/10 p-3 text-sm text-status-critical">
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
          <ProfileCard key={profile.id} profile={profile} onApply={handleApply} applying={applying} />
        ))}
      </div>
    </div>
  )
}
