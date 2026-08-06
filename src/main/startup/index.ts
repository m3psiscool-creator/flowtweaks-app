import type { StartupItem, StartupReport } from '../../shared/ipc-types'
import { listStartupItems } from './listStartupItems'
import { isApprovedEnabled, startupItemId } from './startupApproved'
import { isElevated } from '../system/elevation'

export async function getStartupReport(): Promise<StartupReport> {
  const [raw, elevated] = await Promise.all([listStartupItems(), isElevated()])

  const items: StartupItem[] = raw
    .map((r) => ({
      id: startupItemId(r.scope, r.source, r.name),
      name: r.name,
      command: r.command,
      source: r.source,
      scope: r.scope,
      enabled: isApprovedEnabled(r.approvedRaw),
      needsElevation: r.scope === 'allUsers' && !elevated
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { isElevated: elevated, items }
}

export { toggleStartupItem } from './toggleStartupItem'
