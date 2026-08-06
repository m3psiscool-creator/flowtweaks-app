import type { StartupScope, StartupSource } from '../../shared/ipc-types'

export const STARTUP_APPROVED_RUN_SUBKEY =
  'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
export const STARTUP_APPROVED_FOLDER_SUBKEY =
  'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder'

/**
 * The exact 12-byte binary values Task Manager's own Startup tab writes — first byte is the real
 * flag (0x02/0x06 = enabled, 0x03 = disabled), confirmed against multiple independent registry/
 * forensics references. The disabled value's remaining 8 bytes are normally a FILETIME of when it
 * was disabled — zeroed here since only the leading flag byte affects actual behavior, and it keeps
 * this a plain static value compatible with the same Operation/buildRegistryWriteScript model used
 * everywhere else, rather than needing a live-computed write.
 */
export const STARTUP_APPROVED_ENABLED_HEX = '020000000000000000000000'
export const STARTUP_APPROVED_DISABLED_HEX = '030000000000000000000000'

export function isApprovedEnabled(approvedRaw: string | null): boolean {
  if (!approvedRaw) return true // no override recorded => Windows default => it runs
  const flagByte = approvedRaw.slice(0, 2).toUpperCase()
  return flagByte === '02' || flagByte === '06'
}

export function startupItemId(scope: StartupScope, source: StartupSource, name: string): string {
  return `${scope}:${source}:${name}`
}

export function approvedSubKeyFor(source: StartupSource): string {
  return source === 'startupFolder' ? STARTUP_APPROVED_FOLDER_SUBKEY : STARTUP_APPROVED_RUN_SUBKEY
}

export function approvedHiveFor(scope: StartupScope): 'HKCU' | 'HKLM' {
  return scope === 'user' ? 'HKCU' : 'HKLM'
}
