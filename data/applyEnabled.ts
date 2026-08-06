// Shared between Optimizations and Game Profiles — both need to know which tweaks the app can
// actually apply right now, so a profile bundle and the main tweak list can never disagree.
//
// All remaining registry-only tweaks are enabled here — applyOperation.ts already supports
// 'registry' fully (DWORD/SZ/BINARY), and applyTweak.ts gates admin-required tweaks behind a real
// elevation check (needs-manual-review, not a crash) per CLAUDE.md's hard rule on graceful
// elevation handling. disable-memory-integrity is deliberately excluded — it's a security feature
// (Core Isolation) and high risk, pending a dedicated extra-confirmation UX before it's enabled.
// dns-cloudflare has its own dedicated apply/verify/auto-revert pipeline; sfc-scan/disk-cleanup/
// disable-usb-selective-suspend/optimize-drives-retrim are externalTool; disable-sysmain/
// disable-webclient/disable-imaging-service/disable-telephony/nvidia-disable-telemetry-container
// are services; clear-temp-files is fileCleanup — none of those operation types are supported by
// applyOperation.ts yet. The four amd-* tweaks are amdDriverRegistry, resolved to a concrete
// registry op by src/main/tweaks/gpu/amdRegistry.ts before apply/disable ever see them — verified
// end-to-end on real AMD hardware (elevated apply + disable round trip, ground-truthed against the
// actual registry value both ways) before being added here.
export const APPLY_ENABLED_TWEAK_IDS = new Set([
  'dark-mode',
  'game-mode',
  'fullscreen-optimizations',
  'scheduling-registry-tweaks',
  'hags',
  'disable-fast-startup',
  'visual-effects',
  'dns-cloudflare',
  'disable-hibernation',
  'disable-mouse-acceleration',
  'disable-accessibility-shortcuts',
  'enable-ssd-trim',
  'delivery-optimization-http-only',
  'disable-mixed-reality',
  'deny-nearby-sharing',
  'disable-sensors',
  'disable-location',
  'disable-voice-activation',
  'disable-input-personalization',
  'reduce-telemetry',
  'disable-feedback-prompts',
  'disable-experimentation',
  'disable-settings-sync',
  'disable-bing-search',
  'disable-suggestions-spotlight',
  'suppress-security-notifications',
  'defer-feature-updates',
  'disable-window-animations',
  'amd-disable-radeon-chill',
  'amd-enable-radeon-boost',
  'amd-enable-anti-lag',
  'amd-disable-ulps',
  'nvidia-disable-telemetry'
])

// disableTweak.ts only implements the registry operation type (same scope as applyOperation.ts),
// so dns-cloudflare — a networkDns tweak with its own dedicated apply/verify/auto-revert pipeline
// — can be enabled but not yet turned off from a toggle. That's a real, known gap, not an oversight:
// disabling a live DNS override safely needs the same adapter-topology handling applyDnsTweak.ts
// already does for enabling it, which hasn't been built for the reverse direction yet.
export const DISABLE_ENABLED_TWEAK_IDS = new Set(
  [...APPLY_ENABLED_TWEAK_IDS].filter((id) => id !== 'dns-cloudflare')
)

// Backend licensing doesn't exist yet (see CLAUDE.md's later-phases list), so there's no real
// in-app purchase/license check to run. The unlock CTA just opens the website's pricing section —
// once a customer pays there today, licensing wiring is a separate, later phase.
export const CHECKOUT_URL = 'https://flowtweaks.com/#pricing'
