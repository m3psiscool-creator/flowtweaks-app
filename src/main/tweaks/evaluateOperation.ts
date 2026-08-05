import type { Operation } from '../../../data/schema'

export type OpDetectResult = 'match' | 'mismatch' | 'not-set' | 'error'

/** Registry providers return DWORDs as signed Int32 — 0xFFFFFFFF reads back as -1. */
function normalizeDword(raw: number): number {
  return raw < 0 ? raw + 4294967296 : raw
}

export function evaluateOperation(operation: Operation, rawValue: unknown): OpDetectResult {
  switch (operation.type) {
    case 'registry': {
      if (rawValue === null || rawValue === undefined) return 'not-set'

      if (operation.valueType === 'REG_DWORD') {
        if (typeof rawValue !== 'number') return 'error'
        const desired =
          typeof operation.desiredValue === 'number'
            ? operation.desiredValue
            : Number(operation.desiredValue)
        return normalizeDword(rawValue) === normalizeDword(desired) ? 'match' : 'mismatch'
      }

      if (operation.valueType === 'REG_BINARY') {
        if (typeof rawValue !== 'string') return 'error'
        return rawValue.toUpperCase() === String(operation.desiredValue).toUpperCase()
          ? 'match'
          : 'mismatch'
      }

      // REG_SZ
      return String(rawValue) === String(operation.desiredValue) ? 'match' : 'mismatch'
    }

    case 'service': {
      if (rawValue === null || rawValue === undefined) return 'error'
      const startModeMap: Record<string, string> = {
        auto: 'automatic',
        automatic: 'automatic',
        manual: 'manual',
        disabled: 'disabled'
      }
      const actual = startModeMap[String(rawValue).toLowerCase()] ?? String(rawValue).toLowerCase()
      return actual === operation.desiredStartType ? 'match' : 'mismatch'
    }

    case 'powerPlan': {
      if (rawValue === null || rawValue === undefined) return 'not-set'
      return String(rawValue).toLowerCase().includes(operation.planName.toLowerCase())
        ? 'match'
        : 'mismatch'
    }

    case 'networkDns': {
      if (rawValue === null || rawValue === undefined) return 'error'
      const actual = (Array.isArray(rawValue) ? rawValue : [rawValue]).map((v) =>
        String(v).toLowerCase()
      )
      if (actual.length === 0) return 'not-set'
      const desired = operation.ipv4.map((s) => s.toLowerCase())
      const allPresent = desired.every((d) => actual.includes(d))
      return allPresent ? 'match' : 'mismatch'
    }

    // fileCleanup / externalTool never reach here — filtered out before detection runs.
    default:
      return 'error'
  }
}
