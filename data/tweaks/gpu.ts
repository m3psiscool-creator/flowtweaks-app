import type { TweakDefinition } from '../schema'

export const gpuTweaks: TweakDefinition[] = [
  // Two NVIDIA tweaks below — deliberately not a parallel set to the four AMD ones. NVIDIA's real
  // performance-relevant settings (Low Latency Mode / Reflex, Power Management Mode, Image
  // Sharpening) live in a reverse-engineered binary profile database (nvdrsdb0.bin/nvdrsdb1.bin
  // under ProgramData\NVIDIA Corporation\DRS), not the plain registry — there's no safe, verified
  // way to write that format without either bundling NVAPI bindings or guessing at an undocumented
  // binary layout, and getting it wrong risks corrupting the customer's actual driver profile
  // database. The legacy registry-based workaround (PowerMizerEnable/PowerMizerLevel) was checked
  // and ruled out too — confirmed removed from NVIDIA drivers after version 525, so it would ship
  // as a silent no-op on any current install, the same problem the SvcHost RAM-scaling tweak had.
  // What's left and genuinely safe: telemetry opt-out, cross-checked against two independent
  // sources (a dedicated open-source "Disable Nvidia Telemetry" project and a how-to guide).
  {
    id: 'nvidia-disable-telemetry',
    name: 'Disable NVIDIA Telemetry',
    category: 'gpu',
    whatItChanges: "Opts this PC out of NVIDIA's driver telemetry collection.",
    whyItMayHelp: 'One less background data-collection process reporting home — a privacy opt-out, not a performance change.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: { gpuVendor: ['nvidia'] },
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\NVIDIA Corporation\\NvControlPanel2\\Client',
        valueName: 'OptInOrOutPreference',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\NVIDIA Corporation\\NvControlPanel2\\Client',
        valueName: 'OptInOrOutPreference',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'nvidia-disable-telemetry-container',
    name: 'Disable NVIDIA Telemetry Container',
    category: 'gpu',
    whatItChanges: 'Stops and disables the NVIDIA Telemetry Container service, the background process that actually uploads driver telemetry.',
    whyItMayHelp: 'The registry opt-out stops new data from being collected — this removes the background service that does the uploading, closing the loop.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: { gpuVendor: ['nvidia'] },
    detect: [
      {
        type: 'service',
        serviceName: 'NvTelemetryContainer',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ],
    apply: [
      {
        type: 'service',
        serviceName: 'NvTelemetryContainer',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ]
  },
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
