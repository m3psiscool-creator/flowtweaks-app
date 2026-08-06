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
  },
  {
    id: 'disable-window-animations',
    name: 'Disable Window Animations',
    category: 'personalization',
    whatItChanges: 'Turns off window minimize/maximize/restore animations specifically, without touching any of the other Visual Effects settings.',
    whyItMayHelp: 'For anyone who wants Visual Effects left on its default mix but still finds window-open/close animations adding a beat of delay before a window is usable, this is the one setting on its own.',
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
        path: 'Control Panel\\Desktop\\WindowMetrics',
        valueName: 'MinAnimate',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '1'
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Desktop\\WindowMetrics',
        valueName: 'MinAnimate',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '1'
      }
    ]
  }
]
