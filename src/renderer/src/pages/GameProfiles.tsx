import { useEffect, useState } from 'react'
import { GAME_PROFILES, type GameProfile } from '@data/gameProfiles'
import { getGameSettings } from '@data/gameSettings'
import { CATEGORY_COLORS, type TweakDefinition } from '@data/schema'
import { getTweakById } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS } from '@data/applyEnabled'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import { useAccount } from '@renderer/hooks/useAccount'
import ResultsReport from '@renderer/components/ResultsReport'
import { IconGamepad, IconInfo } from '@renderer/components/icons'

function ProfileCard({
  profile,
  expanded,
  onToggleExpand,
  onApply,
  applying,
  canApply
}: {
  profile: GameProfile
  expanded: boolean
  onToggleExpand: () => void
  onApply: (tweakIds: string[]) => void
  applying: boolean
  canApply: boolean
}): React.JSX.Element {
  const bundleTweaks = profile.tweakIds
    .map((id) => getTweakById(id))
    .filter((t): t is TweakDefinition => t !== undefined)
  const applyableIds = profile.tweakIds.filter((id) => APPLY_ENABLED_TWEAK_IDS.has(id))
  const gameSettings = getGameSettings(profile.id)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggleExpand()
        }
      }}
      className={`ft-glass ft-glass-hover cursor-pointer p-5 ${expanded ? 'border-ft-orange/45' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <IconGamepad className="h-5 w-5 text-ft-orange" />
          <h3 className="ft-heading text-xl text-white">{profile.name}</h3>
        </div>
        {gameSettings && (
          <span className="flex items-center gap-1 text-xs text-white/30">
            <IconInfo className="h-3.5 w-3.5" />
            {expanded ? 'Hide' : 'Details'}
          </span>
        )}
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

      {expanded && gameSettings && (
        <div className="mt-4 border-t border-white/10 pt-4" onClick={(e) => e.stopPropagation()}>
          <p className="flex items-start gap-2 text-xs text-white/50">
            <IconInfo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
            {gameSettings.engineNote}
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-wide text-white/30">
            In-game settings — informational only, not applied by Flow Tweaks
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {gameSettings.settings.map((s) => (
              <div key={s.setting} className="ft-glass-solid p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-xs font-semibold text-white">{s.setting}</span>
                  <span className="ft-heading text-xs tracking-wide text-ft-orange">{s.value}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/45">{s.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (canApply) onApply(applyableIds)
        }}
        disabled={!canApply || applying || applyableIds.length === 0}
        className="ft-heading ft-btn-glow mt-4 w-full rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {!canApply ? 'Locked — unlock in Account' : applying ? 'Applying…' : `Apply Profile (${applyableIds.length})`}
      </button>
    </div>
  )
}

export default function GameProfiles(): React.JSX.Element {
  const { runScan } = useScan()
  const { applying, result, apply, reset } = useApply()
  const { session, hasLicense, loading: accountLoading } = useAccount()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const canApply = session?.user.role === 'staff' || (!!session && hasLicense)

  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleApply(tweakIds: string[]): Promise<void> {
    if (!canApply) return
    await apply(tweakIds)
    runScan()
  }

  return (
    <div>
      <h1 className="text-4xl text-ft-orange">Game Profiles</h1>
      <p className="mt-2 text-white/60">
        Apply a bundle of compatible tweaks tuned for what you&apos;re playing, in one click.
        Click a card for its game-specific breakdown.
      </p>

      {!accountLoading && !canApply && (
        <p className="ft-glass mt-4 border-ft-orange/30 p-3 text-sm text-white/70">
          <span className="text-ft-orange font-semibold">Locked.</span>{' '}
          {session
            ? "This account doesn't have an unlock yet — buy a plan or redeem an access code from the Account tab."
            : 'Sign in and unlock a plan from the Account tab to apply a profile.'}
        </p>
      )}

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
          <ProfileCard
            key={profile.id}
            profile={profile}
            expanded={expandedId === profile.id}
            onToggleExpand={() => setExpandedId((prev) => (prev === profile.id ? null : profile.id))}
            onApply={handleApply}
            applying={applying}
            canApply={canApply}
          />
        ))}
      </div>
    </div>
  )
}
