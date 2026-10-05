import { useContext } from 'react'
import { PreferencesContext } from './preferences-context'

export function usePreferences() {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('usePreferences must be used within PreferencesProvider.')
  return value
}
