import type { Operation, TweakDefinition } from '../schema'

const VOLUME_CACHE_CATEGORIES = [
  'Active Setup Temp Folders',
  'BranchCache',
  'Downloaded Program Files',
  'Internet Cache Files',
  'Memory Dump Files',
  'Old ChkDsk Files',
  'Previous Installations',
  'Recycle Bin',
  'Setup Log Files',
  'System error memory dump files',
  'Temporary Files',
  'Temporary Setup Files',
  'Thumbnail Cache',
  'Update Cleanup',
  'Windows Error Reporting Archive Files',
  'Windows Error Reporting Queue Files',
  'Windows Error Reporting System Archive Files',
  'Windows Error Reporting System Queue Files',
  'Windows Upgrade Log Files'
]

const diskCleanupCategoryOps: Operation[] = VOLUME_CACHE_CATEGORIES.map((category) => ({
  type: 'registry',
  hive: 'HKLM',
  path: `SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VolumeCaches\\${category}`,
  valueName: 'StateFlags0001',
  valueType: 'REG_DWORD',
  desiredValue: 2,
  disabledValue: 0
}))

export const storageCleanupTweaks: TweakDefinition[] = [
  {
    id: 'clear-temp-files',
    name: 'Clear Temp Files',
    category: 'storage-cleanup',
    whatItChanges: 'Deletes files in %TEMP%, C:\\Windows\\Temp, and C:\\Windows\\Prefetch. Files currently in use are skipped automatically.',
    whyItMayHelp: 'Frees up disk space and clears out stale temp/prefetch data that can accumulate over time.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    compatibility: {},
    detect: [],
    apply: [
      {
        type: 'fileCleanup',
        targetPaths: ['%TEMP%', 'C:\\Windows\\Temp', 'C:\\Windows\\Prefetch']
      }
    ]
  },
  {
    id: 'enable-ssd-trim',
    name: 'Enable SSD TRIM',
    category: 'storage-cleanup',
    whatItChanges: 'Makes sure Windows sends TRIM notifications to your drive when files are deleted, so the SSD knows which blocks are actually free.',
    whyItMayHelp: 'Without TRIM, a drive can\'t reclaim deleted blocks ahead of time, which shows up as slower writes as it fills up — this is normally already on by default, this just confirms and corrects it if something turned it off.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: true,
    compatibility: {},
    // Same registry value fsutil behavior set DisableDeleteNotify reads/writes — 0 = TRIM
    // notifications on (the Windows default on virtually every modern install), 1 = off.
    detect: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\FileSystem',
        valueName: 'DisableDeleteNotify',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ],
    apply: [
      {
        type: 'registry',
        hive: 'HKLM',
        path: 'SYSTEM\\CurrentControlSet\\Control\\FileSystem',
        valueName: 'DisableDeleteNotify',
        valueType: 'REG_DWORD',
        desiredValue: 0,
        disabledValue: 1
      }
    ]
  },
  {
    id: 'optimize-drives-retrim',
    name: 'Optimize Drives (Retrim)',
    category: 'storage-cleanup',
    whatItChanges: 'Runs Windows\' Optimize Drives in retrim-only mode (defrag /L) across every drive — the SSD-safe pass, never a traditional block-shuffling defrag.',
    whyItMayHelp: 'This is the same maintenance pass Windows\' own weekly Optimize Drives schedule runs — doing it on demand catches a drive up immediately instead of waiting for the next scheduled run.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    compatibility: {},
    detect: [],
    apply: [
      {
        type: 'externalTool',
        command: 'defrag.exe',
        // /C = every drive, /L = retrim only (SSD-safe) — never a full defrag pass.
        args: ['/C', '/L'],
        interactive: true
      }
    ]
  },
  {
    id: 'disk-cleanup',
    name: 'Disk Cleanup',
    category: 'storage-cleanup',
    whatItChanges: "Configures and runs Windows' built-in Disk Cleanup tool (cleanmgr) across system caches, old installs, and error report queues.",
    whyItMayHelp: 'Reclaims disk space Windows itself accumulates over time — old update files, memory dumps, error report archives.',
    riskLevel: 'low',
    fpsImpact: 'none',
    requiresAdmin: true,
    requiresRestart: false,
    reversible: false,
    compatibility: {},
    detect: [],
    apply: [
      ...diskCleanupCategoryOps,
      {
        type: 'externalTool',
        command: 'cleanmgr.exe',
        args: ['/sagerun:1'],
        interactive: true
      }
    ]
  }
]
