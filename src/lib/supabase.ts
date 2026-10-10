import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isPublicKey(key: string | undefined) {
  if (!key || key === 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY' || key.startsWith('sb_secret_')) return false
  if (key.startsWith('sb_publishable_')) return true

  const [, payload] = key.split('.')
  if (!payload) return false
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(normalized)) as { role?: string }
    return claims.role === 'anon'
  } catch {
    return false
  }
}

function isValidProjectUrl(value: string | undefined) {
  if (!value || value === 'YOUR_SUPABASE_PROJECT_URL') return false
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1')
      && (url.protocol === 'https:' || url.protocol === 'http:')
  } catch {
    return false
  }
}

export const isSupabaseConfigured = isValidProjectUrl(supabaseUrl) && isPublicKey(supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured yet. Add your project URL and anon key in .env.local.')
  }

  return supabase
}
