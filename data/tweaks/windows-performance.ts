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

export const windowsPerformanceTweaks: TweakDefinition[] = [
  {
    id: 'disable-memory-integrity',
    name: 'Disable Memory Integrity',
    category: 'windows-performance',
    whatItChanges: 'Turns off Core Isolation\'s Memory Integrity (hypervisor-enforced code integrity) protection.',
    whyItMayHelp: 'Memory Integrity adds CPU overhead by running extra checks in a virtualized layer; disabling it can free up a small amount of headroom.',
    riskLevel: 'high',
    fpsImpact: 'medium',
    requiresAdmin: true,
    requiresRestart: true,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity',
        valueName: 'Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity',
        valueName: 'Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
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
    id: 'sfc-scan',
    name: 'System File Checker Scan',
    category: 'windows-performance',
    whatItChanges: 'Runs Windows\' built-in System File Checker (sfc /scannow) to find and repair corrupted system files.',
    whyItMayHelp: 'Corrupted system files can cause crashes, stutters, or odd behavior that no registry tweak will fix — this catches that class of problem.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    compatibility: {},
    detect: [],
    apply: [
      {
        type: 'externalTool',
        command: 'sfc.exe',
        args: ['/scannow'],
        interactive: true
      }
    ]
  }
]
