import { useState } from 'react'
import { useAccount } from '@renderer/hooks/useAccount'
import type { AccountTicket } from '@shared/ipc-types'

const STATUS_LABELS: Record<AccountTicket['status'], string> = {
  open: 'Open',
  claimed: 'Claimed',
  in_progress: 'In Progress',
  completed: 'Completed'
}

function TicketRow({ ticket }: { ticket: AccountTicket }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 text-sm">
      <div>
        <span className="text-white/80">{ticket.planLabel}</span>{' '}
        <span className="text-white/40">(${ticket.price.toFixed(2)})</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/40">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>
    </div>
  )
}

export default function Account(): React.JSX.Element {
  const { session, loading, tickets, loadingTickets, error, busy, requestCode, verifyCode, staffLogin, logout } =
    useAccount()

  const [mode, setMode] = useState<'customer' | 'staff'>('customer')
  const [email, setEmail] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

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
        <h1 className="text-4xl text-ft-orange">Account</h1>
        <p className="mt-2 text-white/60">
          Sign in with the email you used at checkout — we&apos;ll email a 6-digit code, no
          password needed.
        </p>

        {mode === 'customer' ? (
          <div className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={codeSent}
              className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
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
                  className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
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
          <div className="mt-6 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Staff username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
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

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

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
    )
  }

  const isStaff = session.user.role === 'staff'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-ft-orange">Account</h1>
        <button
          type="button"
          onClick={logout}
          className="rounded border border-white/20 px-4 py-1.5 text-sm text-white/60 hover:text-white"
        >
          Sign Out
        </button>
      </div>

      <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5">
        <h2 className="ft-heading text-xl text-white/80">{isStaff ? 'Staff' : 'Profile'}</h2>
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

      <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5">
        <h2 className="ft-heading text-xl text-white/80">{isStaff ? 'Customer Tickets' : 'Plan & Support History'}</h2>
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

      {!isStaff && (
        <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5">
          <h2 className="ft-heading text-xl text-white/80">Devices &amp; Updates</h2>
          <p className="mt-2 text-sm text-white/40">
            Device activation limits and in-app auto-updates aren&apos;t built yet — this account
            currently only tracks plan and support history. Nothing fake is shown here.
          </p>
        </section>
      )}
    </div>
  )
}
