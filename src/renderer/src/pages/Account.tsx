import { useState } from 'react'
import { useAccount } from '@renderer/hooks/useAccount'
import type { AccountTicket, AppPurchasablePlan } from '@shared/ipc-types'
import { IconUser, IconShield, IconClock } from '@renderer/components/icons'

const PLANS: { id: AppPurchasablePlan; label: string; price: string; blurb: string }[] = [
  { id: 'pc', label: 'PC', price: '$11.99', blurb: 'Full Windows optimization' },
  { id: 'both', label: 'PC + Console', price: '$14.99', blurb: 'Everything in PC, plus console setup' }
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

export default function Account(): React.JSX.Element {
  const {
    session,
    loading,
    tickets,
    loadingTickets,
    hasLicense,
    error,
    busy,
    requestCode,
    verifyCode,
    staffLogin,
    logout,
    refreshTickets,
    buyPlan,
    redeemCode
  } = useAccount()

  const [mode, setMode] = useState<'customer' | 'staff'>('customer')
  const [email, setEmail] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null)

  if (loading) {
    return (
      <div>
        <h1 className="text-4xl text-ft-orange">Account</h1>
        <p className="mt-4 text-sm text-white/40">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-md">
        <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
          <IconUser className="h-8 w-8" /> Account
        </h1>
        <p className="mt-2 text-white/60">
          Sign in with the email you used at checkout — we&apos;ll email a 6-digit code, no
          password needed.
        </p>

        <div className="ft-glass mt-6 p-5">
          {mode === 'customer' ? (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={codeSent}
                className="rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50"
              />
              {!codeSent ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (await requestCode(email)) setCodeSent(true)
                  }}
                  disabled={busy || !email}
                  className="ft-heading ft-btn-glow rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? 'Sending…' : 'Send Code'}
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => verifyCode(email, code)}
                    disabled={busy || !code}
                    className="ft-heading ft-btn-glow rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {busy ? 'Verifying…' : 'Verify & Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeSent(false)}
                    className="text-xs text-white/40 underline hover:text-white/70"
                  >
                    Use a different email
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Staff username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => staffLogin(username, password)}
                disabled={busy || !username || !password}
                className="ft-heading ft-btn-glow rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? 'Signing in…' : 'Staff Sign In'}
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-status-critical">{error}</p>}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'customer' ? 'staff' : 'customer')
              setCodeSent(false)
            }}
            className="mt-6 text-xs text-white/30 underline hover:text-white/60"
          >
            {mode === 'customer' ? 'Staff login' : 'Back to customer login'}
          </button>
        </div>
      </div>
    )
  }

  const isStaff = session.user.role === 'staff'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
          <IconUser className="h-8 w-8" /> Account
        </h1>
        <button
          type="button"
          onClick={logout}
          className="rounded border border-white/20 px-4 py-1.5 text-sm text-white/60 hover:text-white"
        >
          Sign Out
        </button>
      </div>

      <section className="ft-glass mt-6 p-5">
        <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
          {isStaff ? <IconShield className="h-5 w-5" /> : <IconUser className="h-5 w-5" />}
          {isStaff ? 'Staff' : 'Profile'}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          {isStaff ? session.user.username : session.user.name || session.user.email}
        </p>
        {!isStaff && <p className="text-sm text-white/40">{session.user.email}</p>}
        {isStaff && (
          <p className="mt-1 text-xs text-ft-orange">
            Staff view — showing all open and assigned customer tickets.
          </p>
        )}
      </section>

      {!isStaff && !loadingTickets && !hasLicense && (
        <section className="ft-glass mt-6 border-ft-orange/30 p-5">
          <h2 className="ft-heading text-xl text-ft-orange">Unlock Flow Tweaks</h2>
          <p className="mt-2 text-sm text-white/60">
            Buy a plan to unlock every tweak on this PC, or redeem an access code if you have one.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div key={plan.id} className="ft-glass-solid flex flex-col p-4">
                <span className="ft-heading text-lg text-white">{plan.label}</span>
                <span className="text-2xl font-bold text-ft-orange">{plan.price}</span>
                <span className="mt-1 text-xs text-white/50">{plan.blurb}</span>
                <button
                  type="button"
                  onClick={() => buyPlan(plan.id)}
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
                  const ok = await redeemCode(accessCode)
                  setRedeemMessage(ok ? 'Code redeemed — you\'re unlocked!' : null)
                  if (ok) setAccessCode('')
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

      <section className="ft-glass mt-6 p-5">
        <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
          <IconClock className="h-5 w-5" /> {isStaff ? 'Customer Tickets' : 'Plan & Support History'}
        </h2>
        {loadingTickets ? (
          <p className="mt-3 text-sm text-white/40">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">
            {isStaff ? 'No open or assigned tickets.' : "No orders found on this account yet."}
          </p>
        ) : (
          <div className="mt-3 flex flex-col">
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
