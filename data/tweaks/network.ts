import type { TweakDefinition } from '../schema'

export const networkTweaks: TweakDefinition[] = [
  {
    id: 'dns-cloudflare',
    name: 'Cloudflare DNS',
    category: 'network',
    whatItChanges: "Sets your network adapter's DNS servers to Cloudflare (1.1.1.1 / 1.0.0.1).",
    whyItMayHelp: 'Cloudflare\'s resolver is typically faster than an ISP default, which can shave time off game server/matchmaking lookups — it does not affect in-game ping.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    // Detection is handled by a dedicated, adapter-aware path (src/main/tweaks/dns/), not the
    // generic per-operation scan — same convention as fileCleanup/externalTool tweaks.
    detect: [],
    apply: [
      {
        type: 'networkDns',
        ipv4: ['1.1.1.1', '1.0.0.1'],
        ipv6: ['2606:4700:4700::1111', '2606:4700:4700::1001']
      }
    ]
  }
]
