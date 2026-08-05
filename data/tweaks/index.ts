import type { TweakDefinition } from '../schema'
import { fpsLatencyTweaks } from './fps-latency'
import { gpuTweaks } from './gpu'
import { windowsPerformanceTweaks } from './windows-performance'
import { networkTweaks } from './network'
import { backgroundProcessesTweaks } from './background-processes'
import { storageCleanupTweaks } from './storage-cleanup'
import { personalizationTweaks } from './personalization'

export const ALL_TWEAKS: TweakDefinition[] = [
  ...fpsLatencyTweaks,
  ...gpuTweaks,
  ...windowsPerformanceTweaks,
  ...networkTweaks,
  ...backgroundProcessesTweaks,
  ...storageCleanupTweaks,
  ...personalizationTweaks
]

export function getTweakById(id: string): TweakDefinition | undefined {
  return ALL_TWEAKS.find((tweak) => tweak.id === id)
}
