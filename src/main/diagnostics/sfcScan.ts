import { execFile } from 'child_process'
import { isElevated } from '../system/elevation'
import type { SfcScanResult } from '../../shared/ipc-types'

// sfc.exe writes its result to the console in UTF-16LE — decoding the captured buffer as plain
// utf8 leaves null bytes between every character. 'utf16le' is a valid Node Buffer encoding, so
// asking execFile for it directly avoids needing to strip anything after the fact.
function runSfc(): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'sfc.exe',
      ['/scannow'],
      { windowsHide: true, encoding: 'utf16le', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000 },
      (error, stdout, stderr) => {
        // sfc can exit non-zero even when it ran and reported a real result — judge by the text,
        // not the exit code, same as every other Windows CLI tool that overloads exit codes.
        const output = (stdout || stderr || '').trim()
        if (!output && error) {
          reject(error)
          return
        }
        resolve(output)
      }
    )
  })
}

export async function runSfcScan(): Promise<SfcScanResult> {
  if (!(await isElevated())) {
    return {
      outcome: 'error',
      rawOutput:
        'Flow Tweaks needs administrator rights to run System File Checker. Close the app and reopen it, then accept the "Allow this app to make changes" prompt.'
    }
  }

  try {
    const output = await runSfc()
    const normalized = output.toLowerCase()
    let outcome: SfcScanResult['outcome']
    if (normalized.includes('did not find any integrity violations')) {
      outcome = 'clean'
    } else if (normalized.includes('successfully repaired')) {
      outcome = 'repaired'
    } else if (normalized.includes('unable to fix')) {
      outcome = 'partial'
    } else {
      outcome = 'error'
    }
    return { outcome, rawOutput: output || 'sfc.exe produced no readable output.' }
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    return { outcome: 'error', rawOutput: raw.split('\n')[0]?.trim() || raw }
  }
}
