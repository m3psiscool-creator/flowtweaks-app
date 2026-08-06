export interface BoostGame {
  id: string
  name: string
  /** Executable names (with or without .exe) Boost Mode polls for to detect this game running. */
  processNames: string[]
}

// Only games with a reliably known process name belong here — Boost Mode needs something concrete
// to poll for. General/streaming/low-end profiles from GAME_PROFILES aren't tied to one process,
// so they're not boostable and intentionally don't appear in this list.
export const BOOST_GAMES: BoostGame[] = [
  { id: 'fortnite', name: 'Fortnite', processNames: ['FortniteClient-Win64-Shipping.exe'] },
  { id: 'valorant', name: 'Valorant', processNames: ['VALORANT-Win64-Shipping.exe', 'VALORANT.exe'] },
  { id: 'cs2', name: 'Counter-Strike 2', processNames: ['cs2.exe'] },
  {
    id: 'cod',
    name: 'Call of Duty',
    processNames: ['cod.exe', 'ModernWarfare.exe', 'BlackOps6.exe', 'BlackOpsColdWar.exe']
  }
]
