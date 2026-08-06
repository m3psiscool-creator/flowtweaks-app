// Shared between Optimizations and Game Profiles — both need to know which tweaks the app can
// actually apply right now, so a profile bundle and the main tweak list can never disagree.
//
// All remaining registry-only tweaks are enabled here — applyOperation.ts already supports
// 'registry' fully (DWORD/SZ/BINARY), and applyTweak.ts gates admin-required tweaks behind a real
// elevation check (needs-manual-review, not a crash) per CLAUDE.md's hard rule on graceful
// elevation handling. disable-memory-integrity is deliberately excluded — it's a security feature
// (Core Isolation) and high risk, pending a dedicated extra-confirmation UX before it's enabled.
// dns-cloudflare has its own dedicated apply/verify/auto-revert pipeline; sfc-scan/disk-cleanup are
// externalTool, disable-sysmain is a service, clear-temp-files is fileCleanup — none of those
// operation types are supported by applyOperation.ts yet.
export const APPLY_ENABLED_TWEAK_IDS = new Set([
  'dark-mode',
  'game-mode',
  'fullscreen-optimizations',
  'scheduling-registry-tweaks',
  'hags',
  'disable-fast-startup',
  'visual-effects',
  'dns-cloudflare'
])

// Backend licensing doesn't exist yet (see CLAUDE.md's later-phases list), so there's no real
// in-app purchase/license check to run. The unlock CTA just opens the website's pricing section —
// once a customer pays there today, licensing wiring is a separate, later phase.
export const CHECKOUT_URL = 'https://flowtweaks.com/#pricing'
