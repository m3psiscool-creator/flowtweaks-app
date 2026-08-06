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
  }
]
