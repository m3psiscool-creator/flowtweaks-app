import type { TweakDefinition } from '../schema'

// Every value below is cross-checked against multiple independent, currently-maintained sources
// (not a single blog post) as of August 2026. None of these touch Defender's real-time protection,
// antispyware engine, or cloud sample submission — several tweak guides conflate "quiet the
// notifications" with "turn off the protection," which is exactly the mistake this file avoids.
export const privacyNoiseTweaks: TweakDefinition[] = [
  {
    id: 'deny-nearby-sharing',
    name: 'Disable Nearby Sharing',
    category: 'privacy-noise',
    whatItChanges: 'Turns off Nearby Sharing, which otherwise has this PC discoverable over Bluetooth/Wi-Fi Direct to receive files from nearby devices.',
    whyItMayHelp: 'One less radio-scanning background feature running while you play, and one less way this PC shows up as discoverable to strangers nearby.',
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
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\CDP',
        valueName: 'NearShareChannelUserAuthzPolicy',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\CDP',
        valueName: 'NearShareChannelUserAuthzPolicy',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'disable-sensors',
    name: 'Disable Sensors',
    category: 'privacy-noise',
    whatItChanges: 'Turns off Windows\' generic sensor platform (ambient light, accelerometer, and similar sensors on hardware that has them).',
    whyItMayHelp: 'A desktop or gaming laptop rarely has anything meaningfully using these sensors — one less background polling loop.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors',
        valueName: 'DisableSensors',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors',
        valueName: 'DisableSensors',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      }
    ]
  },
  {
    id: 'disable-location',
    name: 'Disable Location Services',
    category: 'privacy-noise',
    whatItChanges: 'Turns off Windows Location Services system-wide, so no app or background service can query this PC\'s location.',
    whyItMayHelp: 'Removes background location polling entirely — most desktop gaming setups have no real use for it.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors',
        valueName: 'DisableLocation',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors',
        valueName: 'DisableLocation',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      }
    ]
  },
  {
    id: 'disable-voice-activation',
    name: 'Disable App Voice Activation',
    category: 'privacy-noise',
    whatItChanges: 'Turns off "Allow apps to use voice activation," including while the PC is locked, so apps can\'t listen for wake words in the background.',
    whyItMayHelp: 'Removes an always-listening background audio process most competitive players never intentionally use.',
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
        path: 'Software\\Microsoft\\Speech_OneCore\\Settings\\VoiceActivation\\UserPreferenceForAllApps',
        valueName: 'AgentActivationEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Speech_OneCore\\Settings\\VoiceActivation\\UserPreferenceForAllApps',
        valueName: 'AgentActivationOnLockScreenEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Speech_OneCore\\Settings\\VoiceActivation\\UserPreferenceForAllApps',
        valueName: 'AgentActivationEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Speech_OneCore\\Settings\\VoiceActivation\\UserPreferenceForAllApps',
        valueName: 'AgentActivationOnLockScreenEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'disable-input-personalization',
    name: 'Disable Typing & Ink Personalization',
    category: 'privacy-noise',
    whatItChanges: 'Stops Windows from collecting your typing and handwriting patterns to personalize its dictionary and suggestions.',
    whyItMayHelp: 'Removes a background text-collection process — purely a data-collection opt-out, no effect on how typing itself works.',
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
        path: 'Software\\Microsoft\\InputPersonalization',
        valueName: 'RestrictImplicitTextCollection',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\InputPersonalization',
        valueName: 'RestrictImplicitInkCollection',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\InputPersonalization',
        valueName: 'RestrictImplicitTextCollection',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\InputPersonalization',
        valueName: 'RestrictImplicitInkCollection',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      }
    ]
  },
  {
    id: 'reduce-telemetry',
    name: 'Reduce Diagnostic Data',
    category: 'privacy-noise',
    whatItChanges: 'Sets Windows diagnostic data collection to the lowest level this edition allows (Home/Pro can\'t go below "Required"; only Enterprise/Education can select "Security").',
    whyItMayHelp: 'Less background diagnostic upload traffic — a real but modest reduction in one more thing quietly using the network and disk.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection',
        valueName: 'AllowTelemetry',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 3
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection',
        valueName: 'AllowTelemetry',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 3
      }
    ]
  },
  {
    id: 'disable-feedback-prompts',
    name: 'Disable Feedback Prompts',
    category: 'privacy-noise',
    whatItChanges: 'Stops Windows from periodically popping up "How is this working for you?" feedback requests.',
    whyItMayHelp: 'One less interruption competing for focus — purely a notification opt-out.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: false,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    // Reverts to "occasional" (1) rather than Windows' true undocumented "Automatic" default —
    // the default schedule isn't expressed as a clean value, so this is the closest honest revert.
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Siuf\\Rules',
        valueName: 'NumberOfSIUFInPeriod',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Siuf\\Rules',
        valueName: 'NumberOfSIUFInPeriod',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'disable-experimentation',
    name: 'Disable Microsoft Experimentation',
    category: 'privacy-noise',
    whatItChanges: 'Blocks Microsoft from silently A/B-testing Windows Settings changes on this PC in the background.',
    whyItMayHelp:
      'These experiments can change how Settings behaves without warning, mid-session, for reasons that have nothing to do with your setup — worth noting this also blocks Known Issue Rollback, Microsoft\'s mechanism for silently un-shipping a broken update fix, so you may see a bad fix linger slightly longer than normal in exchange.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\PolicyManager\\current\\device\\System',
        valueName: 'AllowExperimentation',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Microsoft\\PolicyManager\\current\\device\\System',
        valueName: 'AllowExperimentation',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'disable-settings-sync',
    name: 'Disable Settings Sync',
    category: 'privacy-noise',
    whatItChanges: 'Turns off Windows syncing your settings (theme, passwords, language, etc.) to a Microsoft account across devices.',
    whyItMayHelp: 'One less background sync process — most useful if this PC is dedicated to gaming rather than shared across your devices.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\SettingSync',
        valueName: 'DisableSettingSync',
        valueType: 'REG_DWORD',
        desiredValue: 2,
        disabledValue: 0
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\SettingSync',
        valueName: 'DisableSettingSync',
        valueType: 'REG_DWORD',
        desiredValue: 2,
        disabledValue: 0
      }
    ]
  },
  {
    id: 'disable-bing-search',
    name: 'Disable Web Results in Search',
    category: 'privacy-noise',
    whatItChanges: 'Stops Start Menu / taskbar search from sending your queries to Bing and mixing in web results, news, and trending stories.',
    whyItMayHelp: 'Local search feels faster without waiting on a network round-trip, and keystrokes typed into search stop leaving this PC.',
    riskLevel: 'low',
    fpsImpact: 'none',
    // One of the two operations below writes to an HKLM Policies key, which needs admin even
    // though the other (HKCU) doesn't — the tweak-level flag has to cover the stricter operation.
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Search',
        valueName: 'BingSearchEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search',
        valueName: 'AllowCloudSearch',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Search',
        valueName: 'BingSearchEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search',
        valueName: 'AllowCloudSearch',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'disable-suggestions-spotlight',
    name: 'Disable Suggestions & Spotlight Nudges',
    category: 'privacy-noise',
    whatItChanges: 'Turns off Start Menu app suggestions, lock screen Spotlight tips, "silently installed" recommended apps, and system-pane suggestion nudges.',
    whyItMayHelp: 'This is where "suggested" Start Menu tiles and unsolicited app installs come from — turning it off keeps the Start Menu to what you actually put there.',
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
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SubscribedContent-338388Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SubscribedContent-353694Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SilentInstalledAppsEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SystemPaneSuggestionsEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'PreInstalledAppsEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SubscribedContent-338388Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SubscribedContent-353694Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SilentInstalledAppsEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'SystemPaneSuggestionsEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager',
        valueName: 'PreInstalledAppsEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'suppress-security-notifications',
    name: 'Suppress Security Toast Popups',
    category: 'privacy-noise',
    whatItChanges:
      'Suppresses the Action Center toast popup Windows Security shows for routine status updates. This only hides that popup — Defender\'s real-time protection, antispyware engine, and cloud sample submission are completely untouched, and the Windows Security app still shows full status when you open it.',
    whyItMayHelp: 'A toast popup stealing focus mid-match for a routine "you\'re protected" status update is pure interruption with zero security benefit.',
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
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\\Windows.SystemToast.SecurityAndMaintenance',
        valueName: 'Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\\Windows.SystemToast.SecurityAndMaintenance',
        valueName: 'Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'defer-feature-updates',
    name: 'Defer Feature Updates',
    category: 'privacy-noise',
    whatItChanges: 'Pushes big Windows feature upgrades (not security updates) back by up to a year, so they don\'t land unannounced.',
    whyItMayHelp: 'A feature upgrade installing itself and rebooting mid-session is one of the worst-timed interruptions Windows can pick — this keeps them on a predictable, delayed schedule instead. Note: Microsoft has scaled back this control on Home/Pro editions in some recent releases, so its effect can vary by edition and build.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate',
        valueName: 'DeferFeatureUpdates',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate',
        valueName: 'DeferFeatureUpdatesPeriodInDays',
        valueType: 'REG_DWORD',
        desiredValue: 365,
        disabledValue: 0
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate',
        valueName: 'DeferFeatureUpdates',
        valueType: 'REG_DWORD',
        desiredValue: 1,
        disabledValue: 0
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate',
        valueName: 'DeferFeatureUpdatesPeriodInDays',
        valueType: 'REG_DWORD',
        desiredValue: 365,
        disabledValue: 0
      }
    ]
  }
]
