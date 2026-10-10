import { requireSupabaseClient } from '../lib/supabase'
import type { Address } from '../types'

export async function fetchAddresses(userId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Address[]
}

export async function saveAddress(userId: string, payload: Partial<Address>) {
  const client = requireSupabaseClient()
  if (payload.is_default) {
    const { error: clearDefaultError } = await client.from('addresses').update({ is_default: false }).eq('user_id', userId)
    if (clearDefaultError) throw new Error(clearDefaultError.message)
  }
  const { data, error } = await client
    .from('addresses')
    .upsert({
      id: payload.id,
      user_id: userId,
      full_name: payload.full_name,
      phone: payload.phone,
      address_line: payload.address_line,
      city: payload.city,
      state: payload.state ?? null,
      postal_code: payload.postal_code,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      is_default: payload.is_default ?? false,
    }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Address
}

export async function deleteAddress(userId: string, addressId: string) {
  const client = requireSupabaseClient()
  const { error } = await client.from('addresses').delete().eq('id', addressId).eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
