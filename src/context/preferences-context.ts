import { createContext } from 'react'
import type { SelectedLocation, ThemeMode } from './preferences-types'

export type LocationStatus = 'idle' | 'detecting' | 'ready' | 'error'

export interface PreferencesValue {
  theme: ThemeMode
  toggleTheme: () => void
  location: SelectedLocation | null
  locationStatus: LocationStatus
  locationError: string
  detectLocation: () => Promise<void>
  searchLocation: (value: string) => void
}

export const PreferencesContext = createContext<PreferencesValue | null>(null)
