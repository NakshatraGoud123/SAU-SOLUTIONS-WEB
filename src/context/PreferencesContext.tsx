import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { PreferencesContext, type LocationStatus, type PreferencesValue } from './preferences-context'
import type { SelectedLocation, ThemeMode } from './preferences-types'
const THEME_KEY = 'sau-theme-v1'
const LOCATION_KEY = 'sau-location-v1'

function readTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.error('Could not read the saved SAU theme preference.', error)
    return 'light'
  }
}

function readLocation(): SelectedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as SelectedLocation
    if (typeof value.label !== 'string' || typeof value.city !== 'string') return null
    return value
  } catch (error) {
    console.error('Could not read the saved SAU location.', error)
    return null
  }
}

function getLocationError(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return 'Location permission was denied. You can search for an area instead.'
  if (error.code === error.POSITION_UNAVAILABLE) return 'Your device could not determine its location. Try searching for an area.'
  if (error.code === error.TIMEOUT) return 'Location detection took too long. Please try again.'
  return 'Could not detect your location. Please try again or search for an area.'
}

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
}

function requestCoordinates(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser does not support GPS location. Search for an area instead.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    })
  })
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(readTheme)
  const [location, setLocation] = useState<SelectedLocation | null>(readLocation)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => location ? 'ready' : 'idle')
  const [locationError, setLocationError] = useState('')

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch (error) {
      console.error('Could not save the SAU theme preference.', error)
    }
  }, [theme])

  const saveLocation = useCallback((nextLocation: SelectedLocation) => {
    setLocation(nextLocation)
    setLocationStatus('ready')
    setLocationError('')
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(nextLocation))
    } catch (error) {
      console.error('Could not save the SAU location.', error)
      setLocationError('Your location is selected, but could not be saved on this device.')
    }
  }, [])

  const detectLocation = useCallback(async () => {
    setLocationStatus('detecting')
    setLocationError('')
    try {
      const position = await requestCoordinates()
      const { latitude, longitude } = position.coords
      const query = new URLSearchParams({
        format: 'jsonv2',
        lat: latitude.toString(),
        lon: longitude.toString(),
        zoom: '16',
        addressdetails: '1',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) throw new Error(`Location lookup failed (${response.status}).`)
      const result = await response.json() as {
        address?: Record<string, string>
      }
      const address = result.address ?? {}
      const city = address.city || address.town || address.village || address.municipality || address.county || address.state_district
      const area = address.suburb || address.neighbourhood || address.quarter || address.residential
      if (!city && !area) throw new Error('The map service did not return a readable area for your location.')
      const label = area && city && area.toLowerCase() !== city.toLowerCase() ? `${area}, ${city}` : area || city!
      saveLocation({ label, city: city || area!, area, latitude, longitude, source: 'gps' })
    } catch (error) {
      setLocationStatus('error')
      setLocationError(isGeolocationError(error) ? getLocationError(error) : error instanceof Error ? error.message : 'Could not detect your location.')
    }
  }, [saveLocation])

  const searchLocation = useCallback(async (value: string) => {
    const queryText = value.trim()
    if (!queryText) {
      setLocationError('Enter a city or area to search.')
      return
    }
    setLocationStatus('detecting')
    setLocationError('')
    try {
      const query = new URLSearchParams({ format: 'jsonv2', q: queryText, addressdetails: '1', limit: '1' })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) throw new Error(`Location search failed (${response.status}).`)
      const results = await response.json() as Array<{
        lat: string
        lon: string
        display_name: string
        name?: string
        address?: Record<string, string>
      }>
      const result = results[0]
      if (!result) throw new Error('No matching location found. Try searching with both the area and city.')
      const address = result.address ?? {}
      const city = address.city || address.town || address.village || address.municipality || address.county || address.state_district || queryText.split(',').at(-1)?.trim() || queryText
      const queryMatch = result.name && queryText.toLowerCase().includes(result.name.toLowerCase()) ? result.name : undefined
      const area = queryMatch || address.neighbourhood || address.suburb || address.quarter || address.residential
      const place = area && city && area.toLowerCase() !== city.toLowerCase()
        ? `${area}, ${city}`
        : area || city || result.display_name
      const latitude = Number(result.lat)
      const longitude = Number(result.lon)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('The map service returned invalid coordinates for this location.')
      saveLocation({ label: place, city, area, latitude, longitude, source: 'search' })
    } catch (error) {
      setLocationStatus('error')
      setLocationError(error instanceof Error ? error.message : 'Could not search for this location.')
    }
  }, [saveLocation])

  const value = useMemo<PreferencesValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light'),
    location,
    locationStatus,
    locationError,
    detectLocation,
    searchLocation,
  }), [theme, location, locationStatus, locationError, detectLocation, searchLocation])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
