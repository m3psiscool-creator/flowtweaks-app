import { useCallback, useEffect, useState } from 'react'
import type { CreateRestorePointResult, RestorePointInfo, RestoreSession, RevertResult } from '@shared/ipc-types'

interface UseRestoreResult {
  restorePoints: RestorePointInfo[]
  sessions: RestoreSession[]
  loading: boolean
  creating: boolean
  createResult: CreateRestorePointResult | null
  createPoint: () => void
  refresh: () => void
  revertingIds: Set<string>
  revertErrors: Record<string, string>
  revertEntry: (entryId: string) => Promise<void>
  revertSession: (sessionId: string) => Promise<void>
  revertTweak: (sessionId: string, tweakId: string) => Promise<void>
}

export function useRestore(): UseRestoreResult {
  const [restorePoints, setRestorePoints] = useState<RestorePointInfo[]>([])
  const [sessions, setSessions] = useState<RestoreSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState<CreateRestorePointResult | null>(null)
  const [revertingIds, setRevertingIds] = useState<Set<string>>(new Set())
  const [revertErrors, setRevertErrors] = useState<Record<string, string>>({})

  const refresh = useCallback(() => {
    setLoading(true)
    Promise.all([window.api.restore.listPoints(), window.api.restore.getSessions()])
      .then(([points, sessionList]) => {
        setRestorePoints(points)
        setSessions(sessionList)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createPoint = useCallback(() => {
    setCreating(true)
    setCreateResult(null)
    window.api.restore
      .createPoint('Flow Tweaks')
      .then((result) => {
        setCreateResult(result)
        if (result.success) refresh()
      })
      .finally(() => setCreating(false))
  }, [refresh])

  const runRevert = useCallback(
    async (id: string, action: () => Promise<RevertResult>) => {
      setRevertingIds((prev) => new Set(prev).add(id))
      setRevertErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      try {
        const result = await action()
        if (!result.success) {
          setRevertErrors((prev) => ({ ...prev, [id]: result.error ?? 'Revert failed.' }))
        }
        refresh()
      } finally {
        setRevertingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [refresh]
  )

  const revertEntry = useCallback(
    (entryId: string) => runRevert(entryId, () => window.api.restore.revertEntry(entryId)),
    [runRevert]
  )

  const revertSession = useCallback(
    (sessionId: string) => runRevert(sessionId, () => window.api.restore.revertSession(sessionId)),
    [runRevert]
  )

  const revertTweak = useCallback(
    (sessionId: string, tweakId: string) =>
      runRevert(`${sessionId}:${tweakId}`, () => window.api.restore.revertTweakInSession(sessionId, tweakId)),
    [runRevert]
  )

  return {
    restorePoints,
    sessions,
    loading,
    creating,
    createResult,
    createPoint,
    refresh,
    revertingIds,
    revertErrors,
    revertEntry,
    revertSession,
    revertTweak
  }
}
