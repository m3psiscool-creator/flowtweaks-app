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
  },
  {
    id: 'disable-webclient',
    name: 'Disable WebClient (WebDAV)',
    category: 'background-processes',
    whatItChanges: 'Stops and disables the WebClient service, which lets Windows browse web servers (WebDAV shares) like local folders.',
    whyItMayHelp: 'Almost nobody uses WebDAV network shares day to day — this is one more background service that never needs to run on a gaming PC.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'service',
        serviceName: 'WebClient',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ],
    apply: [
      {
        type: 'service',
        serviceName: 'WebClient',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ]
  },
  {
    id: 'disable-imaging-service',
    name: 'Disable Windows Imaging (WIA)',
    category: 'background-processes',
    whatItChanges: 'Stops and disables the Windows Image Acquisition service, used for scanners and some camera/imaging devices.',
    whyItMayHelp: 'On a PC with no scanner or imaging device attached, this is background service overhead with nothing to do.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'service',
        serviceName: 'stisvc',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ],
    apply: [
      {
        type: 'service',
        serviceName: 'stisvc',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ]
  },
  {
    id: 'disable-telephony',
    name: 'Disable Telephony',
    category: 'background-processes',
    whatItChanges: 'Stops and disables the Telephony (TAPI) service, used by modems, VoIP, and some fax software to manage phone-line connections.',
    whyItMayHelp: 'A gaming PC virtually never has a modem or VoIP line to manage — one more idle background service removed.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'service',
        serviceName: 'TapiSrv',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ],
    apply: [
      {
        type: 'service',
        serviceName: 'TapiSrv',
        desiredStartType: 'disabled',
        disabledStartType: 'manual',
        stopIfRunning: true
      }
    ]
  },
  {
    id: 'disable-mixed-reality',
    name: 'Disable Windows Mixed Reality',
    category: 'background-processes',
    whatItChanges: 'Prevents the Windows Mixed Reality Portal from running its first-launch setup, effectively turning the feature off.',
    whyItMayHelp: 'Without a WMR headset, this is a feature (and its background footprint) with nothing to do — Windows 11 24H2 removed Mixed Reality entirely, so this is a no-op there.',
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
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Holographic',
        valueName: 'FirstRunSucceeded',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Holographic',
        valueName: 'FirstRunSucceeded',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  }
]
