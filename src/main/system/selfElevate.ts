import { runPowerShell, psQuote } from './powershell'
import { isElevated } from './elevation'

/**
 * Relaunches the app elevated via a real UAC prompt, then the caller quits this instance.
 *
 * The relaunched instance is deliberately pointed at the built renderer output, never the live
 * Vite dev server — quitting this process also tears down electron-vite's dev server (observed
 * directly: closing the window ends the whole `npm run dev` process tree), so a relaunched
 * instance that expected to reach that dev server would just hit a dead URL. Losing HMR for the
 * elevated session is an acceptable trade for not silently failing; `ELECTRON_RENDERER_URL` is
 * explicitly cleared before the elevated relaunch so main/index.ts falls back to loadFile(), same
 * as a production build.
 *
 * Returns true if a relaunch was actually kicked off (caller must quit immediately). Returns
 * false if already elevated, or if the UAC prompt was declined/failed — in both of those cases
 * the app just keeps running unelevated, and the existing "Not running as administrator" UI
 * (CLAUDE.md's graceful-elevation rule) takes it from there.
 */
export async function relaunchElevatedIfNeeded(): Promise<boolean> {
  if (await isElevated()) return false

  const exePath = process.execPath
  const mainScript = process.argv[1] ?? ''
  const argList = mainScript ? `@('${psQuote(mainScript)}')` : '@()'

  const script = `
Remove-Item Env:\\ELECTRON_RENDERER_URL -ErrorAction SilentlyContinue
try {
  Start-Process -FilePath '${psQuote(exePath)}' -ArgumentList ${argList} -Verb RunAs -ErrorAction Stop
  Write-Output 'ELEVATED_OK'
} catch {
  Write-Output 'ELEVATION_DECLINED'
}`

  const stdout = await runPowerShell(script).catch(() => '')
  return stdout.trim() === 'ELEVATED_OK'
}
