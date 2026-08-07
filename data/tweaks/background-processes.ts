import type { TweakDefinition } from '../schema'

export const backgroundProcessesTweaks: TweakDefinition[] = [
  {
    id: 'disable-sysmain',
    name: 'Disable SysMain (Superfetch)',
    category: 'background-processes',
    whatItChanges: 'Stops and disables the SysMain service, which preloads apps into RAM based on usage patterns.',
    whyItMayHelp:
      "On SSD/NVMe systems, SysMain's background disk activity mostly just competes with the game for resources. If your game drive is a spinning HDD, SysMain's preloading is doing real work there — skip this one on HDD-primary setups.",
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
    id: 'disable-gamedvr',
    name: 'Disable Game Bar Background Capture',
    category: 'background-processes',
    whatItChanges:
      'Turns off Xbox Game Bar\'s background capture buffer (GameDVR) and the app-capture pipeline it uses — separate from just hiding the Game Bar overlay.',
    whyItMayHelp:
      'The always-on recording buffer that powers "recent highlights" runs a real background capture pipeline even when you never open Game Bar. Disabling it removes that overhead entirely. Exact FPS/RAM figures circulating online vary too much between sources to repeat as a number — the mechanism is real, treat the size of the effect as unverified.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    detect: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'System\\GameConfigStore',
        valueName: 'GameDVR_Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR',
        valueName: 'AppCaptureEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR',
        valueName: 'AllowGameDVR',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'System\\GameConfigStore',
        valueName: 'GameDVR_Enabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKCU',
        path: 'Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR',
        valueName: 'AppCaptureEnabled',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      },
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR',
        valueName: 'AllowGameDVR',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'nic-power-management',
    name: 'Disable Network Adapter Power Management',
    category: 'background-processes',
    whatItChanges:
      'Runs Disable-NetAdapterPowerManagement across every network adapter, so Windows never idles a NIC down to save power.',
    whyItMayHelp:
      'An idled adapter waking on traffic can introduce a small, inconsistent latency spike right when a packet arrives — separate from USB Selective Suspend, this targets the network adapter\'s own power-down behavior specifically.',
    riskLevel: 'low',
    fpsImpact: 'low',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    // Same class of gap as sfc-scan/disk-cleanup below — externalTool apply isn't wired into the
    // pipeline yet, so this is scan-visible only for now, not one-click-appliable.
    compatibility: {},
    detect: [],
    apply: [
      {
        type: 'externalTool',
        command: 'powershell.exe',
        args: ['-NoProfile', '-Command', 'Disable-NetAdapterPowerManagement -Name * -ErrorAction SilentlyContinue'],
        interactive: false
      }
    ]
  }
]
