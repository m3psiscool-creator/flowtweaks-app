import type { TweakDefinition } from '../schema'

export const personalizationTweaks: TweakDefinition[] = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    category: 'personalization',
    whatItChanges: 'Switches Windows apps and system UI to dark theme.',
    whyItMayHelp: 'Not a performance change — purely cosmetic preference, included because it\'s part of the standard setup pass.',
    riskLevel: 'low',
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
        desiredValue: 0
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'SystemUsesLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'AppsUseLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        valueName: 'SystemUsesLightTheme',
        valueType: 'REG_DWORD',
        desiredValue: 0
      }
    ]
  }
]
