import { getTweakById } from '../../../data/tweaks'
import type { ApplySessionResult, TweakApplyResult } from '../../shared/ipc-types'
import { createRestorePoint } from '../restore/restorePoint'
import { createSession } from '../restore/changeLog'
import { getSystemSpecs } from '../system/systemInfo'
import { isElevated } from '../system/elevation'
import { applyTweak } from './applyTweak'

/** Restore point first, always — no tweak is applied until it exists (CLAUDE.md hard rule #5). */
export async function runApplySession(tweakIds: string[]): Promise<ApplySessionResult> {
  const restorePointResult = await createRestorePoint('Flow Tweaks — before applying tweaks')
  if (!restorePointResult.success) {
    return {
      sessionId: null,
      restorePointCreated: false,
      restorePointError: restorePointResult.error,
      results: []
    }
  }

  const session = await createSession('Applied tweaks', true)
  const [specs, elevated] = await Promise.all([getSystemSpecs(), isElevated()])

  const enabledTweakIds = new Set<string>()
  const results: TweakApplyResult[] = []

  for (const id of tweakIds) {
    const tweak = getTweakById(id)
    if (!tweak) continue

    const result = await applyTweak(tweak, specs, elevated, session.id, enabledTweakIds)
    results.push(result)
    if (result.outcome === 'applied' || result.outcome === 'already-enabled') {
      enabledTweakIds.add(tweak.id)
    }
  }

  return { sessionId: session.id, restorePointCreated: true, results }
}
