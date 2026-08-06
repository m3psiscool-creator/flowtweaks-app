import type { TweakDefinition } from '../schema'

export const fpsLatencyTweaks: TweakDefinition[] = [
  {
    id: 'game-mode',
    name: 'Game Mode',
    category: 'fps-latency',
    whatItChanges: 'Turns on Windows Game Mode, which deprioritizes background tasks in favor of the game in focus.',
    whyItMayHelp: 'Game Mode can reduce background interruptions and stutters while a game is running.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: false,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\GameBar',
        valueName: 'AllowAutoGameMode',
        valueType: 'REG_DWORD',
        desiredValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\GameBar',
        valueName: 'AutoGameModeEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\GameBar',
        valueName: 'AllowAutoGameMode',
        valueType: 'REG_DWORD',
        desiredValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\GameBar',
        valueName: 'AutoGameModeEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 1
      }
    ]
  },
  {
    id: 'scheduling-registry-tweaks',
    name: 'CPU & Network Scheduling',
    category: 'fps-latency',
    whatItChanges:
      'Raises the scheduling priority Windows gives to games, and tunes network throttling settings used for multimedia/game traffic.',
    whyItMayHelp:
      'These are the same low-level scheduler values Windows itself uses to favor foreground games — raising them can reduce input lag and stutter under load.',
    riskLevel: 'medium',
    fpsImpact: 'high',
    requiresAdmin: true,
    requiresRestart: true,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games',
        valueName: 'Scheduling Category',
        valueType: 'REG_SZ',
        desiredValue: 'High'
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\PriorityControl',
        valueName: 'Win32PrioritySeparation',
        valueType: 'REG_DWORD',
        desiredValue: 0x26
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile',
        valueName: 'NetworkThrottlingIndex',
        valueType: 'REG_DWORD',
        desiredValue: 0xffffffff
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile',
        valueName: 'SystemResponsiveness',
        valueType: 'REG_DWORD',
        desiredValue: 0x10
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games',
        valueName: 'Scheduling Category',
        valueType: 'REG_SZ',
        desiredValue: 'High'
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\PriorityControl',
        valueName: 'Win32PrioritySeparation',
        valueType: 'REG_DWORD',
        desiredValue: 0x26
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile',
        valueName: 'NetworkThrottlingIndex',
        valueType: 'REG_DWORD',
        desiredValue: 0xffffffff
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile',
        valueName: 'SystemResponsiveness',
        valueType: 'REG_DWORD',
        desiredValue: 0x10
      }
    ]
  },
  {
    id: 'fullscreen-optimizations',
    name: 'Disable Fullscreen Optimizations',
    category: 'fps-latency',
    whatItChanges: 'Turns off Windows Fullscreen Optimizations so games run in true exclusive fullscreen when they request it.',
    whyItMayHelp: 'True exclusive fullscreen can reduce input latency compared to the borderless-style compositor Windows substitutes by default.',
    riskLevel: 'low',
    fpsImpact: 'medium',
    requiresAdmin: false,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'System\\GameConfigStore',
        valueName: 'GameDVR_FSEBehaviorMode',
        valueType: 'REG_DWORD',
        desiredValue: 2
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'System\\GameConfigStore',
        valueName: 'GameDVR_HonorUserFSEBehaviorMode',
        valueType: 'REG_DWORD',
        desiredValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'System\\GameConfigStore',
        valueName: 'GameDVR_FSEBehaviorMode',
        valueType: 'REG_DWORD',
        desiredValue: 2
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'System\\GameConfigStore',
        valueName: 'GameDVR_HonorUserFSEBehaviorMode',
        valueType: 'REG_DWORD',
        desiredValue: 1
      }
    ]
  }
]
