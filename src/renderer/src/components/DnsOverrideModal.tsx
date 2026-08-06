import { useEffect, useState } from 'react'
import type { DnsOverrideInfo } from '@shared/ipc-types'

interface DnsOverrideModalProps {
  tweakId: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DnsOverrideModal({ tweakId, onConfirm, onCancel }: DnsOverrideModalProps): React.JSX.Element {
  const [info, setInfo] = useState<DnsOverrideInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notApplicable, setNotApplicable] = useState(false)

  useEffect(() => {
    let cancelled = false
    window.api.tweaks
      .getDnsOverrideInfo(tweakId)
      .then((result) => {
        if (cancelled) return
        if (!result) setNotApplicable(true)
        else setInfo(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tweakId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-ft-black p-6">
        <h2 className="ft-heading text-xl text-ft-orange">Override Custom DNS?</h2>

        {loading && <p className="mt-4 text-sm text-white/40">Reading current DNS configuration…</p>}

        {!loading && notApplicable && (
          <p className="mt-4 text-sm text-white/60">
            Current network state no longer has a custom DNS configuration to override — nothing to
            confirm.
          </p>
        )}

        {!loading && info && (
          <>
            <div className="mt-4 rounded border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-white/40">Current servers on &quot;{info.interfaceAlias}&quot;</p>
              <p className="mt-1 text-white">IPv4: {info.ipv4Servers?.join(', ') ?? 'automatic'}</p>
              <p className="text-white">IPv6: {info.ipv6Servers?.join(', ') ?? 'automatic / not applicable'}</p>
            </div>

            <p className="mt-4 text-sm text-white/70">
              These look like custom DNS servers you (or something on this network) set deliberately
              — this could be ad blocking (Pi-hole, AdGuard), a privacy resolver (NextDNS), or a
              corporate/school resolver. Replacing them with Cloudflare&apos;s servers may break
              whatever that custom DNS was doing, and Flow Tweaks has no way to know what that is.
            </p>
            <p className="mt-2 text-sm text-white/40">
              This only changes DNS lookup times (game server browsers, matchmaking, downloads) — it
              does not affect in-game ping.
            </p>
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-sm text-white/60 hover:text-white">
            Cancel
          </button>
          {info && (
            <button
              type="button"
              onClick={onConfirm}
              className="ft-heading rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black hover:opacity-90"
            >
              Override and Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
