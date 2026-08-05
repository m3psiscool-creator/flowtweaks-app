# Flow Tweaks Desktop App

Read this fully before writing any code. Ask questions when something is ambiguous
instead of assuming. Explain what you're doing in plain language — I can follow
instructions but I'm not deep on Electron internals.

---

## 1. WHO I AM AND WHAT THIS BUSINESS IS

I run Flow Tweaks (flowtweaks.com), a PC and console optimization service for
competitive Fortnite and FPS players. I'm a solo operator, sole proprietorship,
based in Missouri. In gaming circles I go by "maps".

Today the service works like this:

- Customer buys a tier on the website (Console $6.99, PC $11.99, Both $14.99 —
  one-time payments, no subscriptions)
- They join my Discord
- I remote into their PC and manually apply optimizations — registry edits,
  debloating, power plan changes, disabling startup programs and services,
  game config files, temp file cleanup, network adapter settings
- 27+ verified five-star reviews so far

The bottleneck is obvious: every sale costs me an hour of my own time. This app
is how the business stops being hourly labor.

## 2. WHAT THIS APP IS

A Windows desktop app that customers download and run on their own PC. It applies
the same optimizations I currently apply by hand.

**Critical distinction: this is NOT a remote access tool.** No HelpWire, no AnyDesk,
no screen sharing, no remote control. The customer's PC is never accessed by me.
The app runs locally on their machine and does the work itself. Any language,
naming, or architecture that implies remote control is wrong.

### What the app can and can't replace

It should handle the repeatable, testable, safe parts of what I do manually:
registry changes, debloating, power settings, startup programs, Windows services,
game config files, temp file cleanup.

It will NOT replace 100% of manual tweaking. When I work on a PC by hand I can
inspect it and make judgment calls. Software can only apply changes that were
programmed and tested for that specific hardware and Windows version. Unusual
problems — driver issues, BIOS settings, overheating, corrupted Windows files,
unsupported hardware — still need me.

The goal is not to automate every possible tweak. The goal is to automate the
majority of useful tweaks **safely**, verify they actually worked, and let the
customer undo them.

### How it makes money

The app is free to download. The tweak packages inside it are locked. When a
customer pays, the package is added to their account and unlocks automatically
inside the app. They never download a .reg file or a script separately. They
press Scan, choose their package, and the app applies every compatible tweak
directly.

## 3. WHAT I ALREADY HAVE (do not rebuild these)

- **Website**: React + Tailwind + Framer Motion, deployed on Vercel, repo
  `m3psiscool-creator/flowoptimizations`. Domain flowtweaks.com via IONOS.
- **Payments**: Stripe checkout via Vercel serverless functions
  (`create-checkout.js`, `stripe-webhook.js`, `order-status.js`)
- **Backend**: Node backend on Render at `flowtweaks-backend.onrender.com`,
  MongoDB Atlas for data, Cloudinary for file storage
- **Existing web features**: customer chat/ticketing system, staff dashboard at
  `/staff/login`, FPS calculator, scheduling system
- **FlowTweaks.bat**: a 17-step batch script I already wrote and use when doing
  manual sessions. It creates a restore point, then walks through the tweaks with
  live progress output and a SKIP option at each step. **This script is the source
  of truth for what tweaks I actually apply.** I'll paste it into the repo — read
  it before designing the tweak schema, because the schema has to be able to
  represent everything it does.

When we get to accounts and licensing, the app authenticates against the existing
Render backend. Do not invent a second backend or a second user database.

## 4. BRAND

- Colors: black `#0d0d0d`, orange `#FF5500`, white
- Fonts: Orbitron and Bebas Neue, heavy all-caps styling
- Tone: competitive gaming, sharp, no corporate softness

The desktop app should feel like the same product as the website.

## 5. STACK

Electron + React + Tailwind + Vite.

I chose Electron over Tauri because I already know React and Tailwind from the
website, and I need to iterate fast. If you think a specific piece is better
handled by a native helper (PowerShell scripts, a small C# service, etc.), say so
and explain the tradeoff rather than silently doing it.

## 6. WHAT THE APP CONTAINS

### Home
Computer name, Windows version, CPU, GPU, RAM, storage, live CPU and memory usage,
optimization status, last optimization date.

### Scan
Examines the PC and determines:
- Which tweaks are compatible with this hardware and Windows version
- Which settings are already active
- Which changes require administrator permission
- Which changes may conflict with the hardware or Windows version

### Optimizations
Tweaks grouped into understandable categories:
- FPS and latency
- Windows performance
- Network
- GPU
- Background processes
- Startup programs
- Storage cleanup
- Game-specific configurations

Every single tweak must display:
- What it changes
- Why it may help
- Risk level
- Whether a restart is required
- Whether it can be reverted
- Its current state on this PC

### Game profiles
Fortnite competitive, Valorant competitive, Counter-Strike 2, Call of Duty,
general gaming, streaming and gaming, low-end computer.

A profile applies several compatible tweaks together as one action.

### Boost mode
An optional tiny background service. The full dashboard does NOT stay open while
someone games — they open it, pick a profile, apply, close it. Most tweaks are
Windows settings that persist without the app running. Boost mode is the only
resident piece.

When a supported game starts:
1. Pause selected background programs
2. Apply temporary performance settings
3. Start monitoring performance
4. Restore the previous settings and processes when the game closes

Similar to Razer Cortex's apply-and-restore behavior.

### Restore and history — THE MOST IMPORTANT PART
Before changing anything on the computer:
- Create a Windows restore point
- Save the previous value of every setting being changed
- Record every change to a local log

The app must support:
- One-click full rollback
- Reverting individual tweaks
- Detecting when a tweak failed

If restore isn't bulletproof, nothing else matters. A customer who can't undo a
change is a refund and a bad review.

### Diagnostics
- Export a diagnostic report
- View optimization history
- View failed changes
- Generate a support code
- Open a Discord support ticket
- Restore default Windows settings

### Account
Login, license status, plan, activated devices, remove an old device, download
updates, referral status, support history. Include a staff-only view behind a
role check so I can read customer diagnostic reports.

## 7. THE RESULTS REPORT

After a run, every tweak is categorized as one of:
- Applied successfully
- Already enabled
- Skipped because incompatible
- Failed
- Needs manual review

The customer sees a summary like:

```
22 tweaks applied successfully
3 were already enabled
2 skipped — not compatible
1 needs manual review
```

This is how I know what still needs human attention. If a customer needs help, the
app generates a support code / diagnostic report. They send it to me and I can see
exactly what was applied, what was skipped, and what's left — without guessing or
redoing work.

## 8. HARD RULES

1. **Check before applying.** Every tweak is validated against that specific PC
   before it runs. Never blind-apply a whole package. Every PC is different and
   applying identical tweaks to everyone is not safe.
2. **Never promise a specific FPS number.** Results depend on hardware and existing
   configuration. No "+40 FPS guaranteed" anywhere in the UI or copy.
3. **Tweak definitions live in data files** (JSON or TS), not hardcoded in
   components. I need to add and edit tweaks without touching UI code.
4. **Request admin elevation properly** and fail gracefully when it's denied —
   show which tweaks are unavailable rather than crashing or silently skipping.
5. **Restore point first, always.** No code path applies a change before the
   restore point and previous-value snapshot exist.
6. **Log everything.** Every change, every failure, with timestamps.

## 9. HOW I WANT YOU TO WORK

Do not build the whole app at once. Work in phases and check in with me between
them.

**Phase 1 — design, before code**
Propose the folder structure and the tweak definition schema. Explain every field
in the schema in plain language and why it's there. Wait for my approval.

**Phase 2 — scaffold**
Set up Electron + React + Tailwind + Vite so it runs with `npm run dev`. Brand
styling applied. No tweak logic yet.

**Phase 3 — Home screen**
Real system detection only: specs, live usage. Nothing is modified on the PC yet.

**Phase 4 — Scan**
Detection of tweak state and compatibility. Read-only. Still nothing modified.

**Phase 5 — Restore infrastructure**
Restore points, value snapshots, change log, rollback. Built and tested BEFORE any
tweak can be applied.

**Phase 6 — Applying tweaks**
Start with the lowest-risk category only.

Later phases (do not start these without asking): account/licensing against the
Render backend, Boost mode, staff view, auto-updates, code signing and installer.

Between phases, tell me what you built, what you'd do next, and anything you're
unsure about.
