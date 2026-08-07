import type { TweakDefinition } from '../schema'

const visualEffectsRegistryOps = [
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Control Panel\\Desktop\\WindowMetrics',
    valueName: 'MinAnimate',
    valueType: 'REG_SZ' as const,
    desiredValue: '0',
    disabledValue: '1'
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    valueName: 'TaskbarAnimations',
    valueType: 'REG_DWORD' as const,
    desiredValue: 0,
    disabledValue: 1
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Control Panel\\Desktop',
    valueName: 'UserPreferencesMask',
    valueType: 'REG_BINARY' as const,
    desiredValue: '9012038010000000',
    disabledValue: '9E3E078012000000'
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects',
    valueName: 'VisualFXSetting',
    valueType: 'REG_DWORD' as const,
    desiredValue: 3,
    disabledValue: 0
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Control Panel\\Desktop',
    // Kept on in both states — this tweak's description promises window drag preview stays on.
    valueName: 'DragFullWindows',
    valueType: 'REG_SZ' as const,
    desiredValue: '1',
    disabledValue: '1'
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Control Panel\\Desktop',
    // Kept on in both states — this tweak's description promises font smoothing stays on.
    valueName: 'FontSmoothing',
    valueType: 'REG_SZ' as const,
    desiredValue: '2',
    disabledValue: '2'
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Control Panel\\Desktop',
    valueName: 'FontSmoothingType',
    valueType: 'REG_DWORD' as const,
    desiredValue: 2,
    disabledValue: 2
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    // Kept on in both states — this tweak's description promises thumbnails stay on.
    valueName: 'IconsOnly',
    valueType: 'REG_DWORD' as const,
    desiredValue: 0,
    disabledValue: 0
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    valueName: 'ListviewAlphaSelect',
    valueType: 'REG_DWORD' as const,
    desiredValue: 0,
    disabledValue: 1
  },
  {
    type: 'registry' as const,
    hive: 'HKCU' as const,
    path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    valueName: 'ListviewShadow',
    valueType: 'REG_DWORD' as const,
    desiredValue: 0,
    disabledValue: 1
  }
]

// disable-memory-integrity was removed entirely (not just gated) after research found Riot
// Vanguard (Valorant's anti-cheat) hard-requires Memory Integrity/VBS to be on — disabling it
// breaks Valorant outright (error VAN9005), not just a performance/security tradeoff. A customer
// who applied this before the fix can turn it back on via Windows Security > Device Security >
// Core Isolation > Memory Integrity (toggle on, restart), or by setting this same registry value
// back to 1: HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity
// \Enabled = 1 (REG_DWORD), then restart.
export const windowsPerformanceTweaks: TweakDefinition[] = [
  {
    id: 'ultimate-performance-power-plan',
    name: 'Ultimate Performance Power Plan',
    category: 'windows-performance',
    whatItChanges: 'Adds and activates the hidden "Ultimate Performance" Windows power plan, which removes most power-saving throttling.',
    whyItMayHelp: 'Prevents Windows from parking CPU cores or stepping down clocks to save power, which matters most on desktops and plugged-in laptops.',
    riskLevel: 'low',
    fpsImpact: 'medium',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'powerPlan',
        sourceGuid: 'e9a42b02-d5df-448d-aa00-03f14749eb61',
        planName: 'Ultimate Performance'
      }
    ],
    apply: [
      {
        type: 'powerPlan',
        sourceGuid: 'e9a42b02-d5df-448d-aa00-03f14749eb61',
        planName: 'Ultimate Performance'
      }
    ]
  },
  {
    id: 'disable-fast-startup',
    name: 'Disable Fast Startup',
    category: 'windows-performance',
    whatItChanges: 'Turns off Fast Startup (hybrid boot), so shutdown does a full shutdown instead of hibernating the kernel session.',
    whyItMayHelp: 'Fast Startup can leave stale driver/network state behind between sessions; a full shutdown avoids that at the cost of a few extra boot seconds.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: true,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power',
        valueName: 'HiberbootEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power',
        valueName: 'HiberbootEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'visual-effects',
    name: 'Visual Effects',
    category: 'windows-performance',
    whatItChanges:
      'Sets Windows visual effects to "Adjust for best performance," keeping only font smoothing, window drag preview, and thumbnails.',
    whyItMayHelp: 'Fewer animations and transparency effects mean less GPU/CPU time spent on desktop compositing.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: false,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: visualEffectsRegistryOps,
    apply: visualEffectsRegistryOps
  },
  {
    id: 'disable-hibernation',
    name: 'Disable Hibernation',
    category: 'windows-performance',
    whatItChanges: 'Turns off Windows Hibernation, removing it from the power menu.',
    whyItMayHelp:
      'Hibernation keeps a large reserved hiberfil.sys on your boot drive and adds a background task most desktop players never use — freeing that reservation up needs a follow-up "powercfg /hibernate off" run outside Flow Tweaks for now, this just disables the feature itself.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    // Desktop-only — a laptop, handheld, or anything that can lose power needs hibernation as a
    // real sleep-state fallback. Gated on actual chassis type, not battery presence: a desktop with
    // a UPS can report a battery over ACPI, so battery alone isn't a safe enough signal here.
    compatibility: { desktopOnly: true },
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\Power',
        valueName: 'HibernateEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\Power',
        valueName: 'HibernateEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'disable-usb-selective-suspend',
    name: 'Disable USB Selective Suspend',
    category: 'windows-performance',
    whatItChanges:
      'Turns off USB Selective Suspend (covers root-hub idle power-down too) on both the plugged-in and battery power profiles, so USB devices are never told to idle down to save power.',
    whyItMayHelp:
      'A wired mouse or keyboard waking from a suspended USB hub adds a small, inconsistent delay right when you move — this removes that source of micro-stutter entirely.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    // externalTool operations have no snapshot/previous-value model — see schema.ts's Operation
    // doc comment. powercfg's own scheme-current alias means this doesn't need the per-machine
    // dynamic subkey resolution the AMD GPU tweaks do, but applying externalTool operations isn't
    // built into the apply pipeline yet (same as sfc-scan/disk-cleanup below) — informational only
    // for now, see data/applyEnabled.ts.
    reversible: false,
    compatibility: {},
    detect: [],
    apply: [
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setacvalueindex', 'scheme_current', '2a737441-1930-4402-8d77-b2bebba308a3', '48e6b7a6-50f5-4782-a5d4-53bb8f07e226', '0'],
        interactive: false
      },
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setdcvalueindex', 'scheme_current', '2a737441-1930-4402-8d77-b2bebba308a3', '48e6b7a6-50f5-4782-a5d4-53bb8f07e226', '0'],
        interactive: false
      },
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setactive', 'scheme_current'],
        interactive: false
      }
    ]
  },
  {
    id: 'core-parking-disable',
    name: 'Disable Core Parking',
    category: 'windows-performance',
    whatItChanges: 'Sets the minimum parked-core count to 0 on the active power plan, so Windows never idles CPU cores into a deep power-saving state.',
    whyItMayHelp:
      'Unparking a core the moment a game\'s main thread needs it costs 1-5ms — enough to show up as an occasional frame-time hitch, not a lower average FPS. Desktop-appropriate; on a laptop this raises idle power draw, heat, and fan noise for a benefit that mostly doesn\'t apply on battery.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    // Same class of gap as disk-cleanup/disable-usb-selective-suspend above — externalTool apply
    // isn't wired into the pipeline yet, so this is scan-visible only for now.
    compatibility: { desktopOnly: true },
    detect: [],
    apply: [
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setacvalueindex', 'scheme_current', 'sub_processor', 'CPMINCORES', '0'],
        interactive: false
      },
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setactive', 'scheme_current'],
        interactive: false
      }
    ]
  },
  {
    id: 'nvme-power-management',
    name: 'NVMe Power Management Tuning',
    category: 'windows-performance',
    whatItChanges:
      'Raises NVMe idle-timeout and transition-latency-tolerance thresholds via powercfg, so a fast drive doesn\'t drop into a deep low-power state during brief idle gaps.',
    whyItMayHelp:
      'Waking an NVMe drive from a deep power state adds real I/O latency — mostly noticeable as an occasional stall during texture streaming or level loads, not steady frame time. Trades a small amount of idle power draw for fewer of those stalls.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    compatibility: {},
    detect: [],
    apply: [
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setacvalueindex', 'scheme_current', 'sub_disk', 'd639518a-e56d-4345-8af2-b9f32fb26109', '0'],
        interactive: false
      },
      {
        type: 'externalTool',
        command: 'powercfg.exe',
        args: ['/setactive', 'scheme_current'],
        interactive: false
      }
    ]
  }
]
