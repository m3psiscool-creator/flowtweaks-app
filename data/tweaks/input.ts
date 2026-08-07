import type { TweakDefinition } from '../schema'

export const inputTweaks: TweakDefinition[] = [
  {
    id: 'disable-mouse-acceleration',
    name: 'Disable Mouse Acceleration',
    category: 'input',
    whatItChanges: 'Turns off Windows\' "Enhance Pointer Precision" mouse acceleration curve, so cursor movement is a flat, consistent ratio to physical mouse movement.',
    whyItMayHelp:
      'Acceleration means the same physical swipe moves the cursor a different distance depending on speed — competitive shooters rely on consistent, repeatable aim, which acceleration actively works against. This is about aim consistency, not frame rate.',
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
        path: 'Control Panel\\Mouse',
        valueName: 'MouseSpeed',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '1'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Mouse',
        valueName: 'MouseThreshold1',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '6'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Mouse',
        valueName: 'MouseThreshold2',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '10'
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Mouse',
        valueName: 'MouseSpeed',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '1'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Mouse',
        valueName: 'MouseThreshold1',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '6'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Mouse',
        valueName: 'MouseThreshold2',
        valueType: 'REG_SZ',
        desiredValue: '0',
        disabledValue: '10'
      }
    ]
  },
  {
    id: 'disable-accessibility-shortcuts',
    name: 'Disable Accidental Accessibility Shortcuts',
    category: 'input',
    whatItChanges:
      'Turns off the hold-a-key-for-several-seconds hotkeys that pop up the StickyKeys, FilterKeys, and ToggleKeys prompts — the accessibility features themselves stay available in Settings if you want them.',
    whyItMayHelp:
      'Competitive binds often spam Shift (crouch/walk) or Num Lock — exactly the keys those hotkeys watch for — so a dialog can steal focus mid-fight. This only removes the accidental trigger, not the features.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: false,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    // Flags is a legacy REG_SZ bitmask on all three of these accessibility keys, not a REG_DWORD.
    // Values cross-checked against multiple independent tweak-guide sources, not just one.
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Accessibility\\StickyKeys',
        valueName: 'Flags',
        valueType: 'REG_SZ',
        desiredValue: '506',
        disabledValue: '510'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Accessibility\\Keyboard Response',
        valueName: 'Flags',
        valueType: 'REG_SZ',
        desiredValue: '122',
        disabledValue: '126'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Accessibility\\ToggleKeys',
        valueName: 'Flags',
        valueType: 'REG_SZ',
        desiredValue: '58',
        disabledValue: '62'
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Accessibility\\StickyKeys',
        valueName: 'Flags',
        valueType: 'REG_SZ',
        desiredValue: '506',
        disabledValue: '510'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Accessibility\\Keyboard Response',
        valueName: 'Flags',
        valueType: 'REG_SZ',
        desiredValue: '122',
        disabledValue: '126'
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Control Panel\\Accessibility\\ToggleKeys',
        valueName: 'Flags',
        valueType: 'REG_SZ',
        desiredValue: '58',
        disabledValue: '62'
      }
    ]
  }
]
