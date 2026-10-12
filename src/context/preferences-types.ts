export type ThemeMode = 'light' | 'dark'

export interface SelectedLocation {
  label: string
  city: string
  area?: string
  latitude?: number
  longitude?: number
  source: 'gps' | 'search'
}
