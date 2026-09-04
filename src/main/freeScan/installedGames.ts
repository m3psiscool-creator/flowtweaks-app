import { runPowerShell } from '../system/powershell'
import type { InstalledGameResult } from '../../shared/ipc-types'

interface RawInstalledGames {
  fortnite?: boolean
  valorant?: boolean
  cs2?: boolean
}

/**
 * Only the three titles below are detected in this pass — each has a documented, structured
 * install manifest we can read without guessing a path (Epic's manifest JSON, Riot's installs
 * JSON, Steam's libraryfolders.vdf + per-app manifest). Call of Duty is deliberately left out: its
 * Battle.net installs are recorded in a binary product.db with no stable public schema, and every
 * default-path guess breaks the moment someone installs to a second drive. Reporting "not
 * installed" from a bad guess would be worse than not reporting at all — same reasoning the doc
 * applies everywhere else to never fabricating a result.
 *
 * configState is 'unknown' for every game in this pass, not a real tuned/not-tuned read yet — each
 * game's actual settings file format (Fortnite's GameUserSettings.ini keys, Valorant's per-install
 * hashed config, CS2's video.txt) needs verifying against a real installed copy before this can
 * safely claim "tuned" or "not tuned" instead of guessing. Flagged as follow-up work, not shipped
 * as a guess.
 */
const DETECTABLE_GAME_IDS = ['fortnite-competitive', 'valorant-competitive', 'cs2-competitive'] as const

function buildScript(): string {
  return `
$ErrorActionPreference = 'SilentlyContinue'
$result = @{ fortnite = $false; valorant = $false; cs2 = $false }

$epicManifestDir = Join-Path $env:PROGRAMDATA 'Epic\\EpicGamesLauncher\\Data\\Manifests'
if (Test-Path $epicManifestDir) {
  Get-ChildItem -Path $epicManifestDir -Filter '*.item' -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $manifest = Get-Content $_.FullName -Raw | ConvertFrom-Json
      if ($manifest.DisplayName -match 'Fortnite') { $result.fortnite = $true }
    } catch {}
  }
}

$riotInstallsPath = Join-Path $env:PROGRAMDATA 'Riot Games\\RiotClientInstalls.json'
if (Test-Path $riotInstallsPath) {
  try {
    $riot = Get-Content $riotInstallsPath -Raw | ConvertFrom-Json
    $props = $riot.PSObject.Properties.Name
    if ($props -match 'valorant') { $result.valorant = $true }
  } catch {}
}

$steamPath = $null
try {
  $steamPath = (Get-ItemProperty -Path 'HKCU:\\Software\\Valve\\Steam' -Name 'SteamPath' -ErrorAction Stop).SteamPath
} catch {}
if ($steamPath -and (Test-Path $steamPath)) {
  $libraryPaths = New-Object System.Collections.ArrayList
  [void]$libraryPaths.Add((Join-Path $steamPath 'steamapps'))
  $libraryVdf = Join-Path $steamPath 'steamapps\\libraryfolders.vdf'
  if (Test-Path $libraryVdf) {
    $content = Get-Content $libraryVdf -Raw
    $vdfMatches = [regex]::Matches($content, '"path"\\s*"([^"]+)"')
    foreach ($m in $vdfMatches) {
      $p = $m.Groups[1].Value -replace '\\\\\\\\', '\\'
      [void]$libraryPaths.Add((Join-Path $p 'steamapps'))
    }
  }
  foreach ($lib in $libraryPaths) {
    if (Test-Path (Join-Path $lib 'appmanifest_730.acf')) { $result.cs2 = $true }
  }
}

$result | ConvertTo-Json -Compress
exit 0
`
}

export async function getInstalledGames(): Promise<InstalledGameResult[]> {
  let raw: RawInstalledGames = {}
  try {
    const stdout = await runPowerShell(buildScript())
    if (stdout) raw = JSON.parse(stdout) as RawInstalledGames
  } catch {
    // Detection script failed — every title reports not-installed rather than guessing.
  }

  const installedById: Record<(typeof DETECTABLE_GAME_IDS)[number], boolean> = {
    'fortnite-competitive': !!raw.fortnite,
    'valorant-competitive': !!raw.valorant,
    'cs2-competitive': !!raw.cs2
  }

  return DETECTABLE_GAME_IDS.map((gameId) => ({
    gameId,
    installed: installedById[gameId],
    configState: 'unknown'
  }))
}
