import { getTweakById } from '../../../data/tweaks'
import type { DisableSessionResult, TweakDisableResult } from '../../shared/ipc-types'
import { createRestorePoint } from '../restore/restorePoint'
import { createSession } from '../restore/changeLog'
import { getSystemSpecs } from '../system/systemInfo'
import { isElevated } from '../system/elevation'
import { disableTweak } from './disableTweak'

/**
 * Restore point first, always — same hard rule as runApplySession, since disabling is still a
 * system change that needs to be undoable if something goes wrong.
 */
export async function runDisableSession(tweakIds: string[]): Promise<DisableSessionResult> {
  const restorePointResult = await createRestorePoint('Flow Tweaks — before disabling tweaks')
  if (!restorePointResult.success) {
    return {
      sessionId: null,
      restorePointCreated: false,
      restorePointError: restorePointResult.error,
      results: []
    }
  }

  const session = await createSession('Disabled tweaks', true)
  const [specs, elevated] = await Promise.all([getSystemSpecs(), isElevated()])

  // excludes-based compatibility checks are meaningless in the disable direction (they exist to
  // stop two conflicting tweaks being enabled together), so this set is never populated — it's
  // only here because evaluateCompatibility's signature is shared with the apply path.
  const enabledTweakIds = new Set<string>()
  const results: TweakDisableResult[] = []

  for (const id of tweakIds) {
    const tweak = getTweakById(id)
    if (!tweak) continue

    const result = await disableTweak(tweak, specs, elevated, session.id, enabledTweakIds)
    results.push(result)
  }

  return { sessionId: session.id, restorePointCreated: true, results }
}
