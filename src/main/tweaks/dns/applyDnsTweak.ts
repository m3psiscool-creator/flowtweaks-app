import type { Operation, TweakDefinition } from '../../../../data/schema'
import type { TweakApplyResult } from '../../../shared/ipc-types'
import { checkDnsCompatibility, getDnsOverrideInfo } from './dnsCompatibility'
import { captureDnsSnapshot } from './dnsSnapshot'
import { buildDnsWriteScript } from '../../system/dnsWrite'
import { runPowerShell } from '../../system/powershell'
import { verifyDnsConnectivity } from './dnsVerify'
import { appendPendingEntry, updateEntryOutcome, revertTweakInSession } from '../../restore/changeLog'

type NetworkDnsOperation = Operation & { type: 'networkDns' }

function getNetworkDnsOperation(tweak: TweakDefinition): NetworkDnsOperation | null {
  const op = tweak.apply.find((o) => o.type === 'networkDns')
  return op && op.type === 'networkDns' ? op : null
}

/**
 * Network tweaks get their own pipeline instead of the generic registry apply loop: adapter
 * selection, dynamic compatibility (not a static declarative rule), and post-apply connectivity
 * verification with auto-revert don't fit "write a value, log it." Still follows the same hard
 * rules as everything else — snapshot before change, log before write (crash-safe pending entry),
 * every failure logged — just with DNS-specific safety on top given this is the highest-risk
 * category: a bad change here can cut off the customer's ability to reach support at all.
 */
export async function applyDnsCloudflareTweak(
  tweak: TweakDefinition,
  sessionId: string,
  allowOverride: boolean
): Promise<TweakApplyResult> {
  const operation = getNetworkDnsOperation(tweak)
  if (!operation) {
    return { tweakId: tweak.id, outcome: 'needs-manual-review', detail: 'No networkDns operation defined for this tweak.' }
  }

  const compat = await checkDnsCompatibility(operation.ipv4, operation.ipv6, allowOverride)
  if (!compat.compatible) {
    return {
      tweakId: tweak.id,
      outcome: compat.overrideAvailable ? 'needs-manual-review' : 'skipped-incompatible',
      detail: compat.reason
    }
  }
  if (compat.alreadyEnabled) {
    return { tweakId: tweak.id, outcome: 'already-enabled' }
  }

  const adapter = compat.adapter!
  const snapshot = await captureDnsSnapshot(adapter)
  if (!snapshot) {
    return {
      tweakId: tweak.id,
      outcome: 'failed',
      detail: `Could not read the current DNS configuration for "${adapter.interfaceAlias}" before applying — skipped for safety.`
    }
  }

  // Pending entry written BEFORE the write is attempted — same crash-safety pattern as registry
  // tweaks. Reconciliation for networkDns entries isn't built yet (falls back to the generic
  // "interrupted, verify manually" outcome), which is safe — it never claims false success — but
  // isn't as automatic as the registry path. Flagged as a known follow-up, not silently skipped.
  const entry = await appendPendingEntry(sessionId, tweak.id, 0, operation, snapshot)

  const v6InScope = snapshot.ipv6.enabled
  const writeScript = buildDnsWriteScript(adapter.interfaceIndex, operation.ipv4, {
    touch: v6InScope,
    servers: v6InScope ? (operation.ipv6 ?? null) : null
  })

  try {
    await runPowerShell(writeScript)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await updateEntryOutcome(sessionId, entry.id, 'failed', message)
    return { tweakId: tweak.id, outcome: 'failed', detail: `Failed to write new DNS servers: ${message}` }
  }

  await updateEntryOutcome(sessionId, entry.id, 'applied')

  const verify = await verifyDnsConnectivity()
  if (verify.success) {
    return { tweakId: tweak.id, outcome: 'applied' }
  }

  // Verification failed — auto-revert immediately, using the same tested revert path the
  // Restore page's manual "Revert" button uses.
  const revertResult = await revertTweakInSession(sessionId, tweak.id)

  // revertTweakInSession only records errorMessage when the revert write itself fails — on
  // success it leaves the entry's errorMessage blank, which would erase *why* this was reverted
  // (an automatic safety response, not a user action). Overwrite it so the change log stays a
  // complete diagnostic record on its own, without needing to cross-reference anything else.
  await updateEntryOutcome(
    sessionId,
    entry.id,
    revertResult.success ? 'reverted' : 'revert-failed',
    `Auto-reverted: connectivity check failed after applying (${verify.detail})${revertResult.success ? '' : ` — and the revert itself failed: ${revertResult.error}`}`
  )

  // Diagnostic-only recheck after reverting — doesn't gate the outcome, just enriches the log so
  // a support code can distinguish "our change broke it" from "something else was already broken."
  const postRevertCheck = await verifyDnsConnectivity()
  const postRevertNote = postRevertCheck.success
    ? ''
    : ' Connectivity is still not verified after reverting — this may not be related to Flow Tweaks.'

  const detail = revertResult.success
    ? `Applied, but the connectivity check failed (${verify.detail}) — automatically reverted to the previous DNS configuration.${postRevertNote}`
    : `Applied, the connectivity check failed (${verify.detail}), and reverting also failed (${revertResult.error}). DNS may still be pointed at the new servers — check the Restore page.`

  return { tweakId: tweak.id, outcome: 'failed', detail }
}

export async function getDnsOverrideInfoForTweak(tweak: TweakDefinition) {
  const operation = getNetworkDnsOperation(tweak)
  if (!operation) return null
  return getDnsOverrideInfo(operation.ipv4, operation.ipv6)
}
