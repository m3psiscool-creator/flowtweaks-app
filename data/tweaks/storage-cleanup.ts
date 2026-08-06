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
  desiredValue: 2
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
