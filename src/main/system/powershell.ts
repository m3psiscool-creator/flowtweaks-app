import { execFile } from 'child_process'

/** Runs a PowerShell script and returns trimmed stdout. Throws on non-zero exit. */
export function runPowerShell(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message))
          return
        }
        resolve(stdout.trim())
      }
    )
  })
}

/** Escapes a string for safe interpolation inside a single-quoted PowerShell literal. */
export function psQuote(value: string): string {
  return value.replace(/'/g, "''")
}
