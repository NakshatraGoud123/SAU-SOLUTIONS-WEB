import { requireSupabaseClient } from '../lib/supabase'
import type { UserProfile } from '../types'

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const client = requireSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return data as UserProfile
}

export async function updateProfile(userId: string, payload: Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>) {
  const client = requireSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserProfile
}
