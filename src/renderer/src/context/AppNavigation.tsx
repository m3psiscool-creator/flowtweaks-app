import { createContext, useContext } from 'react'

// Lets a page (e.g. Optimizations' lock overlay) jump straight to another tab — like Billing —
// without App.tsx having to thread an onNavigate prop through every page component individually.
const AppNavigationContext = createContext<(key: string) => void>(() => {})

export const AppNavigationProvider = AppNavigationContext.Provider

export function useAppNavigation(): (key: string) => void {
  return useContext(AppNavigationContext)
}
