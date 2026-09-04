# Flow Tweaks — Free Scan Feature

Read this fully before writing code. Ask questions when something is
ambiguous instead of assuming. Explain what you're doing in plain language.

---

## 1. WHY WE'RE BUILDING THIS

Flow Tweaks is a PC and console optimization service for competitive Fortnite
and FPS players. Solo operation, sole proprietorship, Missouri. Prices are
**PC $15** and **Console $5**, one-time, no subscriptions.

The Windows desktop app already applies optimizations automatically. Right
now it's a locked box — you download it and can't do anything until you pay.

**The site gets about 136 visitors a month.** Conversion isn't the problem;
almost nobody is finding us. So this feature is not a funnel tweak. It's a
distribution mechanism.

The free scan makes the app useful to someone who has paid nothing. It runs a
full diagnostic, shows them exactly what their PC is leaving on the table with
real numbers, and locks the fix behind payment. A free tool that's genuinely
good gets shared in Discord servers and posted about. That's how we get
traffic.

**Two goals, in order:**
1. Be the best free PC diagnostic in the competitive Fortnite scene
2. Convert a share of those users into $15 and $5 sales

If it reads as a sales gimmick it won't spread and goal 2 dies with goal 1.
Build the diagnostic to stand on its own.

---

## 2. THE HARD PART — SHOWING FPS NUMBERS

Vague benefit copy ("improves frame stability") doesn't sell. People need a
number. But claiming numbers we haven't measured is a refund magnet and a
false-advertising problem.

**The rule: every number shown must be anchored to a measurement we actually
took on that specific machine.**

### How this works

**Step 1 — measure their baseline.** Before showing any projection, the scan
measures current performance on their hardware. See section 5.

**Step 2 — express gains relative to that baseline**, as a range, attributed
to observed outcomes on comparable systems.

Correct:
```
Your current baseline:        142 FPS avg  ·  89 FPS 1% low

Systems with similar specs typically reach:
  168 – 201 FPS avg      (+18% to +42%)
  118 – 140 FPS 1% low   (+33% to +57%)

Based on 14 optimized systems with comparable hardware.
```

Wrong — never generate output like this:
```
Get 200+ FPS!                        (unmeasured absolute claim)
Guaranteed +40 FPS                   (guarantee)
You will gain 58 FPS                 (single number, no range)
Up to +80% performance               ("up to" cherry-picking the max)
```

### Non-negotiable rules for every number

1. **Always a range, never a single figure.** Ranges are honest about
   variance; a point estimate reads as a promise.
2. **Always anchored to their measured baseline**, shown alongside it.
3. **Always state the sample size** the range is drawn from. If we have
   fewer than 5 comparable systems, say so plainly — see section 6.
4. **Never the words** guarantee, guaranteed, will, promise, or "up to".
   Use "typically", "commonly reach", "most systems in this range".
5. **A persistent disclaimer** near any projection: *"Ranges reflect observed
   results on comparable hardware. Your results depend on your specific
   configuration and may fall outside this range."*
6. **Never project for a component we couldn't read.** No data means no
   number for that category.

### Where the ranges come from

Store them in a data file, not hardcoded in components:
`src/data/performanceRanges.json`

Keyed by hardware tier and category. Structure roughly:

```json
{
  "tiers": {
    "gpu_midrange_2020_plus": {
      "match": { "gpu_class": ["1660","2060","3060","4060","6600"] },
      "categories": {
        "background_processes": {
          "avg_fps_pct": [4, 11],
          "low_fps_pct":  [8, 19],
          "sample_size": 14,
          "confidence": "measured"
        }
      }
    }
  }
}
```

`confidence` is one of `measured` (from real customer data),
`conservative_estimate` (our informed guess, deliberately understated), or
`insufficient_data`.

**Seed every tier as `conservative_estimate` with deliberately low ranges.**
We have roughly 27 customers total, which is not enough to claim measured
results per hardware tier. Understating and over-delivering is the correct
direction to be wrong in.

**Build the data collection loop now, even though it pays off later.** After
a paid optimization the app re-measures and reports actual before/after
figures. Those go to the backend. Over time the seeded estimates get replaced
with real measured ranges and the `confidence` field flips to `measured`. The
projections get more accurate and more defensible the longer this runs.

---

## 3. WHAT THE SCAN DOES

Entirely read-only. **The free scan modifies nothing on the PC** — no
registry writes, no service changes, no restore point needed, no admin
elevation required for the scan itself.

If a check requires elevation to read, either skip it or offer an optional
elevation prompt explaining what it unlocks. Never elevate silently.

### Detection

- System specs: CPU, GPU, RAM, storage type and free space, Windows version
  and build, motherboard, monitor refresh rate
- Running background processes, with count and total resource usage
- Startup programs and their measured startup impact
- Windows services running that are unnecessary for gaming
- Current power plan
- GPU driver version and whether it's outdated
- GPU control panel settings that aren't optimal for competitive play
- Network adapter configuration, TCP settings, DNS
- Installed games we have profiles for, and whether their configs are tuned
- Temp file and cache volume
- Whether each tweak in our library is already applied, not applied, or
  incompatible with this system

### Categorization

Every finding lands in one of:
- **Available** — we have a tweak, it's compatible, it's not applied
- **Already optimal** — already configured correctly. Say so. It builds trust
  and proves we actually looked.
- **Incompatible** — not applicable to this hardware or Windows version
- **Needs manual review** — something unusual we can't safely automate

---

## 4. WHAT THE USER SEES

### Scan in progress

Live progress with what's being checked. This should feel thorough — it's the
first impression of competence. Roughly 30–60 seconds is fine; instant feels
shallow.

### Results screen

**Top: their baseline, measured.**
```
YOUR SYSTEM RIGHT NOW
142 FPS average  ·  89 FPS 1% low  ·  47 background processes
```

**Then the headline finding**, with a projected range:
```
31 optimizations available
Systems like yours typically reach 168 – 201 FPS after optimization
Based on 14 comparable systems · your results may vary
```

**Then by category**, each expandable:
```
BACKGROUND PROCESSES              12 available
  Typical gain on systems like yours: +4% to +11% avg FPS
  23 processes running that don't need to be

WINDOWS PERFORMANCE                7 available
  Typical gain: +6% to +14% avg FPS

GPU SETTINGS                       5 available
  Typical gain: +3% to +9% avg FPS

NETWORK                            4 available
  Typical improvement: 15–40ms lower latency

GAME CONFIGS                       3 available
  Fortnite config not tuned for competitive

ALREADY OPTIMAL                    6 checks passed
```

**Locked state.** Each individual tweak is listed by **name and what it
improves**, but the fix is locked:
```
🔒  Disable Xbox Game Bar overlay
    Reduces input latency and frees GPU overhead
    [Unlock with PC package — $15]
```

Name the tweak and the benefit. **Do not show the registry path, the exact
service name, the command, or step-by-step instructions.** Enough that the
value is obvious, not enough to execute it themselves.

### Email results

At the end: **"Email me my results."**

This is the email capture and it should feel like a feature, not a form. They
just watched a scan and want to keep the findings.

- Store the email against the scan data on the backend
- Send a clean summary of what was found and the projected ranges
- This lets us later email something relevant, like new tweaks for their
  specific GPU, rather than generic marketing

Optional and skippable. Never gate the results behind it.

### Conversion

At the bottom, a clear path to purchase. Show what unlocking gets them,
priced at PC $15 / Console $5. Link to flowtweaks.com checkout.

If they already own a package, this is where it says so and offers to apply
the tweaks now.

---

## 5. MEASURING THE BASELINE

The projections are worthless without a real starting number, so this needs
to be right.

**Preferred approach:** a short built-in benchmark. A lightweight rendered
scene run for 20–30 seconds, capturing average FPS and 1% lows. Consistent
across every user, requires no game to be installed, gives us a controlled
number.

**Fallback:** if a benchmark isn't feasible in the app's current
architecture, read existing performance data — Windows performance counters,
Fortnite's own logs if present, GPU driver telemetry.

**Last resort:** if we genuinely cannot measure, show percentage ranges only
and no absolute FPS figures. Never invent a baseline.

Tell me which approach you're taking and why before you build it.

Store every baseline measurement on the backend with the hardware profile.
This is the dataset that eventually makes the projections real.

---

## 6. WHEN WE DON'T HAVE ENOUGH DATA

For a hardware tier with fewer than 5 comparable measured systems, do not
show a projected FPS range. Show:

```
31 optimizations available for your system

We don't have enough data on your exact hardware to project a range yet.
Across all optimized systems we typically see +15% to +35% average FPS.
```

Honest, still has a number, and does not fabricate specificity we don't have.

---

## 7. HARD RULES

1. **The free scan modifies nothing.** No registry writes, no service
   changes, no file deletion. Read-only, always.
2. **Every projection anchored to a measured baseline**, expressed as a
   range, with sample size stated.
3. **No guarantees.** Never the words guarantee, guaranteed, will, promise,
   or "up to".
4. **Never show the how.** Tweak names and benefits only in locked state.
5. **Ranges live in a data file**, not hardcoded in components. I need to
   tune them without touching UI code.
6. **Scan works with no account and no internet** for the local portion.
   Email and telemetry are optional extras that fail gracefully offline.
7. **Never fabricate a baseline or a projection.** Missing data means no
   number for that category.
8. **The scan must be genuinely useful to someone who never pays.** If it
   feels like a demo it won't spread.

---

## 8. BRAND

Black `#0d0d0d`, orange `#FF5500`, white. Orbitron and Bebas Neue, heavy
all-caps. Competitive gaming tone — sharp, direct, no corporate softness.
Same product as flowtweaks.com.

Numbers should feel like a benchmark tool: monospace, large, confident.

---

## 9. HOW I WANT YOU TO WORK

Phases, checking in between each.

**Phase 1 — design, before code.**
- Tell me your approach for baseline measurement (section 5) and why
- Propose the `performanceRanges.json` schema and the tier matching logic
- Propose the results screen layout
- Wait for my approval

**Phase 2** — detection engine. Read-only. Everything in section 3.

**Phase 3** — baseline measurement.

**Phase 4** — projection engine reading `performanceRanges.json`, including
the insufficient-data path.

**Phase 5** — results screen with locked states.

**Phase 6** — email capture and backend storage of scan data.

**Phase 7** — post-purchase re-measurement reporting actual before/after
back to the backend. This is what turns the estimates into real data.

Between phases, tell me what you built, what's next, and what you're unsure
about.

---

## 10. TESTING

- Scan completes on a low-end laptop, a mid-range desktop, and a high-end rig
- Scan modifies nothing — verify with a registry diff before and after
- Scan works without admin elevation, degrading gracefully
- Scan works fully offline
- Hardware tier with no data shows the fallback copy, not a fabricated range
- No output anywhere contains guarantee, guaranteed, will, promise, or "up to"
- Every projection displays alongside its baseline and sample size
- Locked tweaks reveal name and benefit only, never the method
- Baseline measurement is repeatable — two runs on the same idle machine
  land within a reasonable margin
- Email capture is skippable and results still display without it
