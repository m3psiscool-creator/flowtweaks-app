/**
 * Real in-game settings recommendations, researched per game (not Windows-level tweaks — Flow
 * Tweaks doesn't touch game files, this is informational). Cross-referenced across multiple
 * independent settings-guide sources per game as of August 2026, not single-sourced. Genuinely
 * different per game because the games themselves are different — this is the actual content gap
 * the generic Windows-tweak weighting alone can't close.
 */
export interface GameSettingRecommendation {
  setting: string
  value: string
  why: string
}

export interface GameSettingsProfile {
  /** Matches a GameProfile id in data/gameProfiles.ts. */
  gameId: string
  /** One line on the engine/anti-cheat quirk that makes this game's performance profile distinct. */
  engineNote: string
  settings: GameSettingRecommendation[]
}

export const GAME_SETTINGS: GameSettingsProfile[] = [
  {
    gameId: 'valorant-competitive',
    engineNote:
      "Riot's proprietary engine is unusually lightweight, which is exactly why it's so CPU-bound — there's rarely enough GPU work to become the bottleneck. Vanguard, Riot's kernel-level anti-cheat, requires Secure Boot enabled and can conflict with some Windows updates.",
    settings: [
      { setting: 'Multithreaded Rendering', value: 'On', why: 'Spreads work across CPU cores — worth it on any quad-core+ CPU despite slightly less consistent frame times.' },
      { setting: 'Material/Texture/Detail/UI Quality', value: 'Low', why: 'GPU load barely matters here; lowering it costs almost nothing and keeps the CPU the only bottleneck.' },
      { setting: 'V-Sync', value: 'Off', why: 'Caps FPS to refresh rate and adds real input lag.' },
      { setting: 'Bloom / Distortion / Cast Shadows / Vignette', value: 'Off', why: 'Pure visual noise for competitive play, free FPS.' },
      { setting: 'Resolution', value: '1920×1080 native', why: 'What the large majority of pro players run — no competitive reason to go higher.' },
      { setting: 'HRTF (audio)', value: 'On', why: 'True 3D positional audio — the single highest-impact audio setting for tracking footsteps.' }
    ]
  },
  {
    gameId: 'cs2-competitive',
    engineNote:
      "Source 2's sub-tick simulation means the old \"-tickrate 128\" launch option from CS:GO no longer does anything — movement/shooting resolution isn't tied to a fixed tick anymore. Still CPU-bound overall, but the engine's lighting and smoke rendering give the GPU real work too.",
    settings: [
      { setting: 'Display Mode', value: 'Fullscreen (not Borderless/Windowed)', why: 'Exclusive fullscreen avoids the compositor overhead the other modes carry.' },
      { setting: 'V-Sync', value: 'Off', why: 'Same input-lag cost as every other competitive shooter.' },
      { setting: 'Shadow Quality', value: 'Low for max FPS, Medium if you have headroom', why: 'Medium renders enemy shadows around corners before you have direct line of sight — a real information advantage some pros trade FPS for.' },
      { setting: 'fps_max', value: 'Refresh rate + 10 (e.g. 154 for a 144Hz monitor)', why: 'Uncapped (fps_max 0) can cause stutter on some systems — a fixed cap just above your refresh rate is more stable without losing anything visible.' },
      { setting: 'Launch option', value: '+engine_low_latency_sleep_after_client_tick true', why: 'Reduces input latency by changing how the engine sleeps between ticks.' }
    ]
  },
  {
    gameId: 'fortnite-competitive',
    engineNote:
      "Performance Mode strips Unreal Engine 5's heavier rendering path (Nanite/Lumen) entirely — it's a genuinely different, much lighter render path than the default mode, not just lowered settings within the same path. That's why it matters more here than \"turn settings down\" does in most other games.",
    settings: [
      { setting: 'Performance Mode', value: 'On', why: '2-3× higher FPS and noticeably lower input latency for building/editing than the default UE5 renderer — the single biggest lever in this game specifically.' },
      { setting: '3D Resolution', value: '100%', why: 'Never lower this — it blurs distant enemies and makes them harder to spot, which costs more than the FPS gained is worth.' },
      { setting: 'View Distance', value: 'Far', why: 'Needed to actually see distant players and builds despite low settings elsewhere.' },
      { setting: 'Shadows / Anti-Aliasing / Motion Blur', value: 'Off', why: 'Pure FPS with no competitive downside.' },
      { setting: 'NVIDIA Reflex / AMD Anti-Lag 2', value: 'On + Boost', why: 'Directly reduces input latency — free performance if your GPU supports it.' },
      { setting: 'Texture Streaming', value: 'On', why: 'Most pros keep this on specifically for player-model visibility, unlike other settings they strip.' }
    ]
  },
  {
    gameId: 'cod-competitive',
    engineNote:
      "The IW engine forces on-demand texture streaming on — you can no longer fully disable it like older Call of Duty titles. It also has a documented RAM-usage-climbs-over-a-session issue, which is part of why background-process and memory tweaks matter more for this game than the other three.",
    settings: [
      { setting: 'Render Resolution', value: '100% native', why: 'Leave at native unless you\'re deliberately using DLSS/FSR upscaling.' },
      { setting: 'Texture Resolution', value: 'Normal + streaming off, or High if VRAM allows', why: 'Some competitive benchmarks show Normal + disabling on-demand streaming recovers 15-20 FPS and removes mid-match stutter — but low textures hurt enemy visibility against terrain, so this is a real tradeoff, not a free win.' },
      { setting: 'On-Demand Texture Streaming', value: 'Optimized on a fast connection, Minimal on a capped/slow one', why: 'Optimized pulls higher-quality textures live, which can itself cause stutter if your connection hiccups mid-match.' },
      { setting: 'Shadows / Particle Quality / Volumetric Quality', value: 'Low', why: 'Standard competitive FPS trade — little visual cost, real GPU headroom back.' },
      { setting: 'Reflections', value: 'Off', why: 'Expensive to render, no competitive value.' }
    ]
  }
]

export function getGameSettings(gameId: string): GameSettingsProfile | undefined {
  return GAME_SETTINGS.find((g) => g.gameId === gameId)
}
