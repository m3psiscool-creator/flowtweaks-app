import type { TweakDefinition } from '../schema'

export const gpuTweaks: TweakDefinition[] = [
  {
    id: 'hags',
    name: 'Hardware-Accelerated GPU Scheduling',
    category: 'gpu',
    whatItChanges: 'Turns on HAGS, letting your GPU manage its own memory queue instead of relying entirely on Windows.',
    whyItMayHelp: 'On supported drivers, HAGS can reduce latency by cutting out a layer of CPU-side scheduling overhead.',
    riskLevel: 'medium',
    fpsImpact: 'medium',
    requiresAdmin: true,
    requiresRestart: true,
    reversible: true,
    compatibility: {
      minWindowsBuild: 19041
    },
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers',
        valueName: 'HwSchMode',
        valueType: 'REG_DWORD',
        desiredValue: 2,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers',
        valueName: 'HwSchMode',
        valueType: 'REG_DWORD',
        desiredValue: 2,
        disabledValue: 1
      }
    ]
  },
  // The four AMD tweaks below write to KMD_ChillEnabled / KMD_RadeonBoostEnabled /
  // KMD_DeLagEnabled / EnableUlps — real value names read directly off a live AMD Adrenalin driver
  // install during development, not guessed from forum posts (which is exactly why the names here
  // don't match the usual "EnableChill"/"EnableBoost"/"EnableAntiLag" guesses circulating online —
  // AMD's driver internally calls Anti-Lag "DeLag"). All REG_DWORD, confirmed via GetValueKind on
  // the same real hardware. "Anti-Lag Deluxe" is a separate, newer mechanism and is deliberately
  // NOT included here — see Part 3 approval.
  {
    id: 'amd-disable-radeon-chill',
    name: 'Disable Radeon Chill',
    category: 'gpu',
    whatItChanges: 'Turns off Radeon Chill, which otherwise dynamically caps your frame rate during low on-screen motion to save power.',
    whyItMayHelp: 'Chill\'s whole job is capping FPS below your max whenever it thinks little is moving — exactly the moments competitive play needs full frame rate ready (holding an angle, tracking a distant target). Turning it off keeps FPS uncapped at all times.',
    riskLevel: 'medium',
    fpsImpact: 'medium',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: { gpuVendor: ['amd'] },
    detect: [
      { type: 'amdDriverRegistry', valueName: 'KMD_ChillEnabled', valueType: 'REG_DWORD', desiredValue: 0, disabledValue: 1 }
    ],
    apply: [
      { type: 'amdDriverRegistry', valueName: 'KMD_ChillEnabled', valueType: 'REG_DWORD', desiredValue: 0, disabledValue: 1 }
    ]
  },
  {
    id: 'amd-enable-radeon-boost',
    name: 'Enable Radeon Boost',
    category: 'gpu',
    whatItChanges: 'Turns on Radeon Boost, which briefly lowers render resolution during fast camera motion to raise frame rate, then restores it once motion settles.',
    whyItMayHelp: 'The resolution drop is normally imperceptible during the fast motion it targets, and the FPS gain during exactly those moments is real and measurable — a genuine tradeoff worth knowing about, not a free lunch, which is why this is medium risk rather than low.',
    riskLevel: 'medium',
    fpsImpact: 'high',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: { gpuVendor: ['amd'] },
    detect: [
      { type: 'amdDriverRegistry', valueName: 'KMD_RadeonBoostEnabled', valueType: 'REG_DWORD', desiredValue: 1, disabledValue: 0 }
    ],
    apply: [
      { type: 'amdDriverRegistry', valueName: 'KMD_RadeonBoostEnabled', valueType: 'REG_DWORD', desiredValue: 1, disabledValue: 0 }
    ]
  },
  {
    id: 'amd-enable-anti-lag',
    name: 'Enable Radeon Anti-Lag',
    category: 'gpu',
    whatItChanges: 'Turns on Radeon Anti-Lag (the classic mechanism, not Anti-Lag Deluxe), which paces the CPU so it doesn\'t queue frames too far ahead of what the GPU can render.',
    whyItMayHelp: 'Same category of fix as NVIDIA Reflex — it directly targets input latency rather than raw frame rate, which matters a lot for how responsive aiming feels even when the FPS counter doesn\'t move much.',
    riskLevel: 'medium',
    fpsImpact: 'medium',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: { gpuVendor: ['amd'] },
    detect: [
      { type: 'amdDriverRegistry', valueName: 'KMD_DeLagEnabled', valueType: 'REG_DWORD', desiredValue: 1, disabledValue: 0 }
    ],
    apply: [
      { type: 'amdDriverRegistry', valueName: 'KMD_DeLagEnabled', valueType: 'REG_DWORD', desiredValue: 1, disabledValue: 0 }
    ]
  },
  {
    id: 'amd-disable-ulps',
    name: 'Disable ULPS',
    category: 'gpu',
    whatItChanges: 'Turns off ULPS (Ultra Low Power State), which otherwise aggressively powers down parts of the GPU when AMD\'s driver thinks it\'s idle.',
    whyItMayHelp: 'ULPS transitions are a known, documented source of stutter and momentary driver hiccups on some AMD setups as the GPU powers components back up — disabling it trades a small amount of idle power draw for one less place stutter can come from.',
    riskLevel: 'medium',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: true,
    reversible: true,
    compatibility: { gpuVendor: ['amd'] },
    detect: [
      { type: 'amdDriverRegistry', valueName: 'EnableUlps', valueType: 'REG_DWORD', desiredValue: 0, disabledValue: 1 }
    ],
    apply: [
      { type: 'amdDriverRegistry', valueName: 'EnableUlps', valueType: 'REG_DWORD', desiredValue: 0, disabledValue: 1 }
    ]
  }
]
