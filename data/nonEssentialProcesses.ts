/**
 * Informational only — the free scan's "N processes running that don't need to be" line (see
 * CLAUDE-free-scan.md section 4). This is NOT a tweak list: nothing here gets an apply/detect
 * operation or a kill switch, it just names things for the customer to notice and close themselves.
 * Kept conservative and uncontroversial on purpose — flagging something a player actually wants
 * running (Discord, Steam, their recording software) would read as wrong and undermine trust in
 * the rest of the scan.
 */
export interface NonEssentialProcessDefinition {
  /** Matched case-insensitively against the running process name, without the .exe extension. */
  processName: string
  label: string
  reason: string
}

export const NON_ESSENTIAL_PROCESSES: NonEssentialProcessDefinition[] = [
  { processName: 'OneDrive', label: 'OneDrive', reason: 'Cloud sync running in the background, competing for disk and network I/O.' },
  { processName: 'Widgets', label: 'Windows Widgets', reason: "Windows 11's news/widgets panel — runs continuously even if you never open it." },
  { processName: 'YourPhone', label: 'Phone Link', reason: "Microsoft's phone-mirroring app, usually not needed while gaming." },
  { processName: 'PhoneExperienceHost', label: 'Phone Link (host)', reason: 'Background host process for Phone Link.' },
  { processName: 'CCXProcess', label: 'Adobe Creative Cloud helper', reason: 'Adobe\'s background updater/sync helper.' },
  { processName: 'CCLibrary', label: 'Adobe Creative Cloud Libraries', reason: 'Adobe\'s background asset-sync helper.' },
  { processName: 'CoreSync', label: 'Adobe Creative Cloud sync', reason: 'Adobe\'s background file-sync helper.' },
  { processName: 'Spotify', label: 'Spotify', reason: 'Fine to keep for music, but idles in the background using RAM and network even when paused.' },
  { processName: 'Skype', label: 'Skype', reason: 'Background chat client most people no longer actively use.' },
  { processName: 'Teams', label: 'Microsoft Teams', reason: "Often left running by its auto-start setting long after a call ends." },
  { processName: 'DropboxClient', label: 'Dropbox', reason: 'Cloud sync running in the background, competing for disk and network I/O.' },
  { processName: 'CCleaner', label: 'CCleaner', reason: 'Background monitoring process for a tool you run manually anyway.' },
  { processName: 'SearchProtocolHost', label: 'Windows Search indexing helper', reason: 'Actively indexing files in the background.' },
  { processName: 'RtkAudUService64', label: 'Realtek Audio Console service', reason: 'Background helper for the Realtek audio control panel, rarely needed after initial setup.' },
  { processName: 'GameBar', label: 'Xbox Game Bar', reason: "Runs even if you never open it with Win+G." },
  { processName: 'GameBarFTServer', label: 'Xbox Game Bar (companion)', reason: 'Companion background process for Game Bar.' },
  { processName: 'McUICnt', label: 'McAfee UI helper', reason: 'Background UI helper for McAfee, separate from the actual protection service.' },
  { processName: 'iCUE', label: 'Corsair iCUE', reason: 'RGB/peripheral control software with a known heavier background footprint — keep if you rely on its lighting profiles, otherwise it is pure overhead.' },
  { processName: 'LGHUB', label: 'Logitech G HUB', reason: 'RGB/peripheral control software that stays resident even when its window is closed.' },
  { processName: 'SynapseUI', label: 'Razer Synapse', reason: 'RGB/peripheral control software that stays resident even when its window is closed.' }
]
