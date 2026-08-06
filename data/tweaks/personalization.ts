import type { TweakDefinition } from '../schema'

export const personalizationTweaks: TweakDefinition[] = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    category: 'personalization',
    whatItChanges: 'Switches Windows apps and system UI to dark theme.',
    whyItMayHelp: 'Not a performance change — purely cosmetic preference, included because it\'s part of the standard setup pass.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: false,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'AppsUseLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'SystemUsesLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'AppsUseLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'SystemUsesLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  }
]
