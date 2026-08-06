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
  },
  {
    id: 'delivery-optimization-http-only',
    name: 'Delivery Optimization: Microsoft Only',
    category: 'network',
    whatItChanges: 'Sets Windows Update Delivery Optimization to download only from Microsoft, instead of also uploading to and downloading from other PCs (peer-to-peer).',
    whyItMayHelp: 'Peer-to-peer update sharing can saturate upload bandwidth in the background without warning — this stops that traffic entirely while updates still download normally.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization',
        valueName: 'DODownloadMode',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization',
        valueName: 'DODownloadMode',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  }
]
