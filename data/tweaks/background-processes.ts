import type { TweakDefinition } from '../schema'

export const backgroundProcessesTweaks: TweakDefinition[] = [
  {
    id: 'disable-sysmain',
    name: 'Disable SysMain (Superfetch)',
    category: 'background-processes',
    whatItChanges: 'Stops and disables the SysMain service, which preloads apps into RAM based on usage patterns.',
    whyItMayHelp: 'On systems with fast storage and enough RAM, SysMain\'s background disk activity mostly just competes with the game for resources.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'service',
        serviceName: 'SysMain',
        desiredStartType: 'disabled',
        disabledStartType: 'automatic',
        stopIfRunning: true
      }
    ],
    apply: [
      {
        type: 'service',
        serviceName: 'SysMain',
        desiredStartType: 'disabled',
        disabledStartType: 'automatic',
        stopIfRunning: true
      }
    ]
  }
]
