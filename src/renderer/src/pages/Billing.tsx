import { useState } from 'react'
import { useAccount } from '@renderer/hooks/useAccount'
import type { AccountTicket, AppPurchasablePlan } from '@shared/ipc-types'
import { IconCreditCard, IconShield, IconClock, IconSparkle } from '@renderer/components/icons'
import { REFERRAL_URL } from '@renderer/lib/links'

// PC+Console combo was discontinued as a purchase option — see AppPurchasablePlan. Anyone who
// already bought it keeps their unlock (useAccount's hasAppLicense still honors 'both' tickets);
// this list is only what's newly purchasable.
const PLANS: { id: AppPurchasablePlan; label: string; price: string; blurb: string }[] = [
  { id: 'pc', label: 'PC', price: '$15.00', blurb: 'Full Windows optimization' }
]

const STATUS_LABELS: Record<AccountTicket['status'], string> = {
  open: 'Open',
  claimed: 'Claimed',
  in_progress: 'In Progress',
  completed: 'Completed'
}

const STATUS_CLASSES: Record<AccountTicket['status'], string> = {
  open: 'bg-status-warning/15 text-status-warning',
  claimed: 'bg-cat-blue/15 text-cat-blue',
  in_progress: 'bg-cat-blue/15 text-cat-blue',
  completed: 'bg-status-good/15 text-status-good'
}

function TicketRow({ ticket }: { ticket: AccountTicket }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm last:border-0">
      <div>
        <span className="text-white/80">{ticket.planLabel}</span>{' '}
        <span className="text-white/40">(${ticket.price.toFixed(2)})</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/40">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_CLASSES[ticket.status]}`}>
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>
    </div>
  )
}

export default function Billing(): React.JSX.Element {
  const {
    session,
    loading,
    tickets,
    loadingTickets,
    ticketsError,
    hasLicense,
    error,
    busy,
    refreshTickets,
    buyPlan,
    redeemCode
  } = useAccount()

  const [accessCode, setAccessCode] = useState('')
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')

  if (loading) {
    return (
      <div>
        <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
          <IconCreditCard className="h-8 w-8" /> Billing
        </h1>
        <p className="mt-4 text-sm text-white/40">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-md">
        <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
          <IconCreditCard className="h-8 w-8" /> Billing
        </h1>
        <p className="mt-4 text-white/60">
          Sign in from the Account tab to buy a plan, redeem a code, or see your payment history.
        </p>
      </div>
    )
  }

  const isStaff = session.user.role === 'staff'

  return (
    <div className="max-w-2xl">
      <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
        <IconCreditCard className="h-8 w-8" /> Billing
      </h1>

      {isStaff && (
        <p className="mt-4 text-sm text-white/50">
          Staff accounts don&apos;t buy plans — manage customer tickets from the Account tab.
        </p>
      )}

      {!isStaff && (
        <a
          href={REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ft-glass ft-hoverable-subtle mt-6 flex items-center justify-between gap-3 border-ft-orange/30 p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <IconSparkle className="h-6 w-6 shrink-0 text-ft-orange" />
            <div>
              <p className="ft-heading text-base text-white">Join the referral program</p>
              <p className="text-sm text-white/50">
                Share your code — earn free tweaks for every friend who buys.
              </p>
            </div>
          </div>
          <span className="ft-heading shrink-0 text-sm tracking-wide text-ft-orange">Get my code →</span>
        </a>
      )}

      {!isStaff && loadingTickets && (
        <section className="ft-glass mt-6 p-5">
          <p className="text-sm text-white/50">Checking your account…</p>
        </section>
      )}

      {!isStaff && !loadingTickets && ticketsError && !hasLicense && (
        <section className="ft-glass mt-6 border-status-warning/30 p-5">
          <p className="text-sm text-white/60">
            Couldn&apos;t reach the server to check your account — this can happen right after the
            backend wakes up from being idle. This doesn&apos;t mean you&apos;re unlicensed.
          </p>
          <button
            type="button"
            onClick={refreshTickets}
            className="ft-heading mt-3 rounded border border-ft-orange/50 px-4 py-2 text-sm text-ft-orange hover:bg-ft-orange/10"
          >
            Retry
          </button>
        </section>
      )}

      {!isStaff && !loadingTickets && !ticketsError && !hasLicense && (
        <section className="ft-glass mt-6 border-ft-orange/30 p-5">
          <h2 className="ft-heading text-xl text-ft-orange">Unlock Flow Tweaks</h2>
          <p className="mt-2 text-sm text-white/60">
            Buy a plan to unlock every tweak on this PC, or redeem an access code if you have one.
          </p>

          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-white/40">
              Referral code <span className="normal-case text-white/25">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AB12CD"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full max-w-xs rounded border border-white/15 bg-black/40 px-3 py-2 text-sm uppercase tracking-widest text-white"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div key={plan.id} className="ft-glass-solid flex flex-col p-4">
                <span className="ft-heading text-lg text-white">{plan.label}</span>
                <span className="text-2xl font-bold text-ft-orange">{plan.price}</span>
                <span className="mt-1 text-xs text-white/50">{plan.blurb}</span>
                <button
                  type="button"
                  onClick={() => buyPlan(plan.id, referralCode)}
                  disabled={busy}
                  className="ft-heading ft-btn-glow mt-4 rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? 'Opening checkout…' : `Buy — ${plan.price}`}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/30">
            Opens Stripe checkout in your browser. Once paid, come back here and hit Refresh below.
          </p>

          <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4">
            <label className="text-xs uppercase tracking-wide text-white/40">Have an access code?</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="flex-1 rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={async () => {
                  setRedeemMessage(null)
                  const result = await redeemCode(accessCode)
                  if (result.ok) {
                    // Only pc/both tickets actually unlock this app (see useAccount's
                    // hasAppLicense) — a console code redeems for real, but doesn't unlock
                    // anything here, so saying "you're unlocked!" for one would be a lie.
                    setRedeemMessage(
                      result.plan === 'console'
                        ? 'Code redeemed — this grants a console tweak, handled via your Discord ticket. It won’t unlock this app.'
                        : 'Code redeemed — you’re unlocked!'
                    )
                    setAccessCode('')
                  }
                }}
                disabled={busy || !accessCode}
                className="rounded border border-ft-orange/50 px-4 py-2 text-sm text-ft-orange hover:bg-ft-orange/10 disabled:opacity-40"
              >
                Redeem
              </button>
            </div>
            {redeemMessage && <p className="text-sm text-status-good">{redeemMessage}</p>}
            {error && <p className="text-sm text-status-critical">{error}</p>}
          </div>

          <button
            type="button"
            onClick={refreshTickets}
            disabled={loadingTickets}
            className="mt-4 text-xs text-white/40 underline hover:text-white/70 disabled:opacity-40"
          >
            {loadingTickets ? 'Checking…' : 'Refresh — I already paid'}
          </button>
        </section>
      )}

      {!isStaff && hasLicense && (
        <section className="ft-glass mt-6 border-status-good/30 p-5">
          <h2 className="ft-heading flex items-center gap-2 text-xl text-status-good">
            <IconShield className="h-5 w-5" /> Unlocked
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Your tweaks are unlocked on this account — head to Optimizations to get started.
          </p>
        </section>
      )}

      {!isStaff && (
        <section className="ft-glass mt-6 p-5">
          <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
            <IconClock className="h-5 w-5" /> Plan & Payment History
          </h2>
          {loadingTickets ? (
            <p className="mt-3 text-sm text-white/40">Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No orders found on this account yet.</p>
          ) : (
            <div className="mt-3 flex flex-col">
              {tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
