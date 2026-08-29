# Flow Tweaks — Referral System + Coupon Codes

Read this fully before writing any code. Ask questions when something is
ambiguous instead of assuming. Explain what you're doing in plain language —
I can follow instructions but I'm not deep on payment infrastructure.

---

## 1. WHO I AM AND WHAT THIS BUSINESS IS

I run Flow Tweaks (flowtweaks.com), a PC and console optimization service for
competitive Fortnite and FPS players. Solo operator, sole proprietorship,
based in Missouri. In gaming circles I go by "maps".

**How the business actually runs:**

- Customer buys a tier on the website — one-time payments, no subscriptions
- Everything after the sale happens in Discord: support, delivery, tickets
- Historically I remote in and tweak the PC by hand, about an hour per sale
- A Windows desktop app now handles the repeatable parts automatically
- 27+ verified five-star reviews so far

**Pricing:**

| id        | name              | price   | cents | net after Stripe |
|-----------|-------------------|---------|-------|------------------|
| `console` | Console           | $5.00   | 500   | ~$4.56           |
| `pc`      | PC                | $15.00  | 1500  | ~$14.27          |

These IDs are referenced across the existing codebase. Do not change them. The
`both` (PC+Console combo) plan has been **retired** — it's no longer sellable
(see `frontend/src/components/site/Pricing.jsx` and `PLAN_PRICES` in
`backend/server.py`) and does not appear anywhere in this spec below. Net
figures are approximate (2.9% + $0.30 standard Stripe card rate).

**Things about this business that should shape your decisions:**

- **I am the entire operations team.** Anything that needs a human in the
  loop needs *me*, and I'm not available on a schedule. Prefer designs that
  fail safe and wait for me over designs that act automatically and might be
  wrong.
- **Volume is small right now.** Dozens of sales, not thousands. A manual
  button in the staff dashboard is a perfectly good v1. Do not build queue
  infrastructure or background job systems for a problem I don't have yet.
- **Discord is the customer relationship**, not email. Referrers are
  identified by Discord handle. Notifications go to a Discord webhook.
- **My margins are thin in absolute terms.** A $3 mistake per referral
  matters at $6.99 a sale. Every reward amount in this spec was calculated
  against the net figures above.

**Payment setup — read before building cash payouts:**

The Stripe account holder is a parent, and payouts route to CashApp. Cash
referral payouts use Stripe Connect, which makes us a *platform* sending
money to third parties — a different arrangement from simply accepting
payments. **Confirm with Stripe that Connect is permitted on this account
before writing any payout code.** If it isn't, the tweaks-only path still
works and ships independently.

---

## 2. WHAT WE ARE BUILDING

### A. Referral program with two reward types

Any customer can request a referral code. When someone else buys using that
code, the referrer earns a reward. The referrer chooses how they're paid.

**Reward type: TWEAKS** — free services. Every qualified referral is worth
**1 point**, regardless of which plan the referred person bought.

| Redemption           | Points |
|----------------------|--------|
| Free Console tweak   | 1      |
| Free PC tweak        | 3      |

**Reward type: CASH** — real money to their bank via Stripe Connect. Amount
depends on what the referred person bought:

| Referred purchase | Cash reward |
|-------------------|-------------|
| `console`         | $1.00       |
| `pc`              | $3.00       |

**These are two separate currencies.** Cash in cents, tweaks in whole
points. They never convert between each other in either direction.

The referrer sets `reward_type` on their account and can change it any time.
**The type is locked in per referral at the moment it is recorded** —
changing the preference affects future referrals only. Without this someone
banks fifty referrals as points, flips to cash, and claims real money on all
of them retroactively.

### B. Coupon codes

Standard promo codes (percentage or fixed amount off) created and managed in
the Stripe dashboard.

**Referral codes and coupon codes are different things and must not be
conflated:**
- A **coupon code** discounts the current purchase for the buyer
- A **referral code** rewards a third party and discounts nothing

Both are enterable at checkout, independently.

---

## 3. WHAT I ALREADY HAVE (do not rebuild these)

- **Website**: React + Tailwind + Framer Motion on Vercel, repo
  `m3psiscool-creator/flowoptimizations`. Vercel root directory is
  `frontend`.
- **Payments**: Stripe Checkout via Vercel serverless functions in
  `frontend/api/` — `create-checkout.js`, `stripe-webhook.js`,
  `order-status.js`. Live and working.
- **Backend**: `backend/` in the same repo, deployed as the Render service
  `flowtweaks-backend`. MongoDB Atlas for data. JWT auth already exists for
  the staff dashboard.
  > **Confirm the backend language before writing endpoints.** My notes say
  > Python FastAPI (`server.py`); other documentation says Node. Check the
  > repo and tell me which is correct rather than guessing.
- **Pages**: `Landing.jsx`, `Success.jsx`, `Terms.jsx`, `StaffLogin.jsx`,
  `StaffDashboard.jsx`
- **Components**: `frontend/src/components/site/` — `Nav`, `Hero`, `Stats`,
  `Pricing`, `Reviews`, `FPSCalculator`, `HowItWorks`, `FAQ`, `Footer`
- **Desktop app**: separate private repo `m3psiscool-creator/flowtweaks-app`.
  Electron + React + Tailwind + Vite. Free to download; tweak packages are
  locked until purchased, then unlock automatically in the customer's
  account. It authenticates against the same Render backend.
- **Existing env vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `DISCORD_WEBHOOK_URL`
- **UptimeRobot** pings the backend every 5 minutes to stop Render sleeping.
  A cron that hits our endpoints can piggyback on the same approach.

Do not invent a second backend or a second user database.

---

## 4. HOW A FREE TWEAK IS ACTUALLY DELIVERED

This is the piece most likely to be built wrong, so read it carefully.

Because the desktop app now delivers the service, redeeming points should
**unlock the package on the referrer's account**, exactly as a purchase
does. There is no payment, no Stripe Checkout session, and no manual
session required.

```
POST /api/referral/redeem
  body: { email, plan_id }
  - POINT_COSTS = { console: 1, pc: 3 }
  - REJECT if points_balance < cost
  - deduct points and grant the package entitlement in ONE transaction
  - use the SAME entitlement-granting code path the Stripe webhook uses
    after a paid order — do not write a parallel one
  - record a tweak_redemptions row
  - POST to DISCORD_WEBHOOK_URL with a visibly distinct embed
    (different colour and title from a paid order) so I can tell
    redemptions from sales at a glance
  - return { plan_id, points_remaining }
```

**Find the existing entitlement code before writing this.** If granting
access happens in the Stripe webhook, extract it into a shared function that
both paths call. Two code paths that grant access will drift apart and one
of them will end up wrong.

If a customer's entitlement needs manual work for any reason, the Discord
post is what tells me. Do not build an automated fallback.

---

## 5. ECONOMICS — do not change these numbers without recalculating

The tweaks path is deliberately generous. One referral of any kind earns a
free console tweak. Since the app delivers it, the marginal cost to me is
close to zero — which is exactly why this rate is affordable now and would
not have been when every tweak cost me an hour.

Guardrails:
- Never lower the point costs below section 2
- Never let a cash reward exceed 40% of net revenue on any plan
- The staff dashboard must show total cash paid and total redemptions so I
  can watch this and adjust

---

## 6. HARD RULES

1. **Never collect bank account or routing numbers.** Stripe Connect Express
   hosts onboarding and stores bank details on Stripe's servers. We store
   only the returned `acct_xxx` ID. No exceptions, no "just for now".
2. **14-day holding period before any reward lands.** Refunds and
   chargebacks arrive after the sale. Cash is unrecoverable once
   transferred and a redeemed tweak is unrecoverable once used.
3. **Prices and rewards are server-side only.** Never accept an amount,
   plan, balance or point total from the client.
4. **Idempotency on every money path.** Stripe retries webhooks. A
   double-submitted redeem must not grant two packages.
5. **All money in cents as integers. Points as whole integers.** Never
   floats for either.
6. **An invalid referral code must never block a purchase.** Ignore it
   silently and let the sale complete.
7. **Log every change and every failure with timestamps**, including who
   made any manual adjustment.

---

## 7. DATA MODEL

```
referrers
  id                  PK
  discord_handle      str, unique, required
  email               str, unique, required
  code                str, unique, uppercase, 6-8 chars
  reward_type         enum: tweaks | cash    (default tweaks)
  points_balance      int, default 0
  cash_balance        int (cents), default 0
  lifetime_points     int, default 0
  lifetime_cash       int (cents), default 0
  stripe_connect_id   str, nullable
  payouts_enabled     bool, default false
  status              enum: active | suspended
  created_at          datetime

referral_events
  id                  PK
  referrer_id         FK -> referrers.id
  referrer_code       str  (denormalized for auditing)
  stripe_session_id   str, UNIQUE          <-- idempotency guard
  order_id            str  (the referred purchase)
  buyer_email         str
  plan_id             str  (console | pc)
  reward_type         enum: tweaks | cash   (LOCKED at record time)
  cash_amount         int (cents), 0 if tweaks
  points_amount       int, 0 if cash
  status              enum: pending | qualified | voided
  created_at          datetime
  qualified_at        datetime, nullable

tweak_redemptions
  id                  PK
  referrer_id         FK
  plan_id             str
  points_spent        int
  status              enum: granted | needs_review
  created_at          datetime

cash_payouts
  id                  PK
  referrer_id         FK
  amount              int (cents)
  stripe_transfer_id  str, nullable
  status              enum: pending | sent | failed
  failure_reason      str, nullable
  created_at          datetime
  sent_at             datetime, nullable
```

---

## 8. ENDPOINTS

### Public

```
POST /api/referral/auth/request
  body: { email, discord_handle? }
  - discord_handle only used if this email has no referral account yet at verify time
  - always sends a 6-digit email code (10 min expiry) and returns the same generic
    { ok, message, expires_in } either way — never reveals whether the email is registered
  - rate limited by IP

POST /api/referral/auth/verify
  body: { email, code }
  - verifies the code; if no referrer exists for this email, creates one (needs
    discord_handle from the matching /auth/request call — 400 if missing), generating a
    unique code, uppercase alphanumeric, exclude 0/O/1/I/L; new signups always start
    reward_type: tweaks
  - 403 if the referrer is suspended
  - issues a JWT (role: referrer, 30-day TTL, same pattern as customer/staff tokens)
  - return { token, code, reward_type }
  - rate limited by IP (this is the endpoint that guards against code-guessing, not just
    /auth/request)

  Replaces the original spec's unauthenticated POST /api/referral/signup and the
  "unauthenticated email lookup" design for balance/redeem/reward-type below — those let
  anyone who merely knew a referrer's email view their balance, redeem their points, or
  flip their reward-type preference. Every referral endpoint below except validate now
  requires this token (X-Authorization: Bearer, same as customer/staff auth) instead of
  taking email as a client-supplied parameter.

GET /api/referral/validate/{code}
  - returns { valid: bool } only — never leak the referrer's identity
  - the one referral endpoint that stays fully public — a buyer validating someone else's
    code at checkout has no account of their own to authenticate with

GET /api/referral/balance                                    (requires referrer token)
  - { code, reward_type, points_balance, cash_balance, pending_points,
      pending_cash, referral_count, lifetime_points, lifetime_cash,
      payouts_enabled, needs_connect_onboarding,
      redeemable: { console, pc } }
  - `code` added beyond the original spec — Referral.jsx's balance view needs it for the
    copy-to-clipboard code/share-link, and signup only returns it once, at signup time
  - referrer identified by the token's sub, not a query param

POST /api/referral/reward-type                                (requires referrer token)
  - body: { reward_type } — no email; changes preference for FUTURE referrals only

POST /api/referral/redeem          (see section 4)             (requires referrer token)
  - body: { plan_id } — no email; unlocks on the customer account matching the
    authenticated referrer's own email on file

POST /api/referral/connect/onboard
  - creates Stripe Express account if needed, returns onboarding_url

GET  /api/referral/connect/return
  - re-fetch account, set payouts_enabled from account.payouts_enabled
```

### Internal (called by Vercel functions, `X-Internal-Secret` header)

```
POST /api/referral/record
  body: { referrer_code, stripe_session_id, order_id, buyer_email,
          plan_id, amount_paid }
  - REJECT self-referral (buyer_email == referrer email)
  - REJECT if buyer_email already counted (first purchase only)
  - REJECT if stripe_session_id already recorded
  - snapshot referrer.reward_type onto the event
  - cash: console=100, pc=300 | tweaks: points_amount=1
  - status=pending

POST /api/referral/qualify         daily cron
  - pending -> qualified where older than REFERRAL_HOLD_DAYS
  - add to the balance matching the event's LOCKED reward_type

POST /api/referral/void
  body: { stripe_session_id, reason }
  - called on charge.refunded and charge.dispute.created
  - status=voided; subtract if already qualified; floor at 0
  - if it would go negative, floor and flag the referrer for review

POST /api/referral/payout-run      monthly cron
  - where cash_balance >= PAYOUT_MINIMUM_CENTS and payouts_enabled
  - stripe.transfers.create({ amount, currency:'usd',
      destination: stripe_connect_id })
  - success: zero balance, store transfer id
  - failure: record reason, LEAVE the balance intact
  - must be idempotent — never double-send on rerun
```

### Staff (behind existing JWT auth)

```
GET  /api/staff/referrals            filter by status and type
GET  /api/staff/referrers            both balances
GET  /api/staff/redemptions          free tweaks granted
GET  /api/staff/payouts              payout history
GET  /api/staff/referral-summary     cash paid, redemptions, totals
POST /api/staff/referrer/{id}/suspend
POST /api/staff/referrer/{id}/adjust manual adjustment + required reason
POST /api/staff/payout/{id}/retry
```

---

## 9. CASH PAYOUT RULES

- **Minimum $15.00.** Below that the balance accumulates. Do not send $1
  transfers.
- **Monthly, on the 1st.** State this publicly.
- **No Connect account, no payout.** Balance sits until they onboard. Show
  a clear prompt.
- Enable Stripe's 1099 filing when configuring Connect. At these rates
  hitting $600 needs ~200 referrals, so it's unlikely — configure it now
  rather than discovering it in January.

---

## 10. CHECKOUT CHANGES

### `frontend/api/create-checkout.js`
- accept `{ service, referral_code, buyer_email }`
- validate the code against the backend; if invalid, ignore silently
- store `referral_code` in session `metadata`
- add `allow_promotion_codes: true` — this gives a promo field inside
  Stripe Checkout, so coupons are managed entirely in the Stripe dashboard
  under Products → Coupons → Promotion codes. No custom coupon code needed.

Free tweaks do **not** go through Checkout. Do not build a credit-discount
path here.

### `frontend/api/stripe-webhook.js`
- keep the existing Discord post; add the referral code to the embed
- if `metadata.referral_code` present, POST to `/api/referral/record`
- add `charge.refunded` and `charge.dispute.created` → `/api/referral/void`
- **do not remove `bodyParser: false`** — the raw body is required for
  signature verification

---

## 11. FRONTEND

### New page `frontend/src/pages/Referral.jsx` at `/referral`
- Plain-language explanation with the reward table
- Signup: Discord handle, email, reward type toggle with the tradeoff
  stated — tweaks are instant with no setup but can't be cashed out; cash
  needs a Stripe setup, $15 minimum, paid monthly
- Balance view: points, cash, pending, referral count, lifetime totals
- Redeem panel — a button per affordable plan, confirming the package was
  unlocked and telling them to open the desktop app
- "Set up payouts" button when `needs_connect_onboarding`
- Reward type switch, with a note that it applies to future referrals only
- Copy-to-clipboard for the code and share link `flowtweaks.com/?ref=CODE`

### `Pricing.jsx`
- Optional "Referral code" input above the buy buttons, live validation
- Pass the code to `create-checkout`
- No coupon input here — `allow_promotion_codes` handles it

### Landing page
- Read `?ref=CODE` from the URL, store in `localStorage` for 30 days,
  prefill the referral input

### `App.js`
- Add the `/referral` route

### `StaffDashboard.jsx`
- Referrals tab, Redemptions tab, Payouts tab
- Summary card: total cash paid, total redemptions

---

## 12. ANTI-ABUSE

- Self-referral blocked by email match
- One reward per buyer email ever — first purchase only, not repeats
- Codes case-insensitive on input, stored uppercase
- Rate limit signup, balance, reward-type and redeem by IP
- Suspended referrers earn nothing, their code fails validation, and they
  cannot redeem
- Voided referrals subtract if already granted
- Reward type snapshotted per event, never retroactively changed
- Redemption transactional — a double-submit must not grant twice

Do not attempt IP-based fraud detection. It produces false positives on
shared networks and households, which is common in this customer base.

---

## 13. ENV VARS

```
INTERNAL_API_SECRET      shared secret, Vercel functions <-> backend
BACKEND_URL              https://flowtweaks-backend.onrender.com
FRONTEND_URL             https://flowtweaks.com
REFERRAL_HOLD_DAYS       14
PAYOUT_MINIMUM_CENTS     1500
```

Vercel needs `INTERNAL_API_SECRET`, `BACKEND_URL`, `FRONTEND_URL` on
Production and Preview. Render needs `INTERNAL_API_SECRET`,
`STRIPE_SECRET_KEY`, `DISCORD_WEBHOOK_URL`, `FRONTEND_URL`,
`REFERRAL_HOLD_DAYS`, `PAYOUT_MINIMUM_CENTS`.

**Env changes on Vercel require a manual redeploy to take effect.** This has
bitten me before.

Never commit secrets. Never log a full secret or Stripe key.

---

## 14. HOW I WANT YOU TO WORK

Work in phases and check in between them. Tell me what you built, what's
next, and anything you're unsure about.

**Phase 1 — design, before code.** Confirm the backend language, find the
existing entitlement-granting code, and propose how `/api/referral/redeem`
reuses it. Wait for my approval.

**Phase 2** — models and migrations
**Phase 3** — signup, code generation, validation, reward-type
**Phase 4** — `/api/referral/record` with all anti-abuse rules
**Phase 5** — wire `stripe-webhook.js`; refund and dispute handlers
**Phase 6** — qualification cron
**Phase 7** — redeem endpoint, transactional
**Phase 8** — `Referral.jsx`, tweaks only
**Phase 9** — referral input in `Pricing.jsx`, `?ref=` capture
**Phase 10** — `allow_promotion_codes` for coupons
**Phase 11** — staff dashboard tabs

Stop there. Run tweaks-only in production for a few weeks before we discuss
cash. Stripe Connect and the payout cron move real money and are where
mistakes are expensive and irreversible — and Connect needs confirming with
Stripe first regardless.

---

## 15. TESTING

Stripe test mode throughout. Forward webhooks with
`stripe listen --forward-to localhost:3000/api/stripe-webhook`.

Must pass:
- Referral gives 1 point when reward_type=tweaks, on every plan
- Referral gives the right cash when reward_type=cash, on every plan
- Duplicate webhook delivery rewards once
- Self-referral rejected
- Repeat purchase by the same buyer does not reward again
- Invalid code does not block the purchase
- Refund voids a pending referral
- Refund voids a qualified referral and subtracts
- Neither balance goes negative
- Redeem with exactly enough points grants the package
- Redeem with insufficient points is rejected
- Double-submitted redeem grants once
- Redemption posts a Discord embed visibly distinct from a sale
- Changing reward type leaves existing events untouched
- Payout run skips below-minimum and non-onboarded referrers
- Payout run is idempotent on rerun
- Failed transfer leaves the balance intact

---

## 16. BRAND AND CONVENTIONS

- Colors: black `#0d0d0d`, orange `#FF5500`, white
- Fonts: Orbitron and Bebas Neue, heavy all-caps
- Tone: competitive gaming, sharp, no corporate softness. The referral page
  should feel like the same product as the rest of the site.
- Functional React components; named exports for `components/site/*`,
  default exports for pages; Tailwind classes inline
- Vercel functions are ESM (`export default async function handler`)
- **Keep JSX simple.** Avoid deeply nested multi-line tags — past edits
  through the GitHub web editor have silently dropped opening tags and
  broken builds.

---

## 17. PUBLIC TERMS TO WRITE

Add to `Terms.jsx`:
- What qualifies as a referral
- The 14-day holding period
- Point costs for each free tweak
- The $15 cash minimum and monthly schedule
- That points cannot be converted to cash or withdrawn
- That reward type applies to future referrals only
- That we may void fraudulent referrals or end the program
