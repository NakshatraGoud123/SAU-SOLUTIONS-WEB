import { requireSupabaseClient } from '../lib/supabase'

export async function fetchBookings(userId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('bookings')
    .select('*, services(name, slug), addresses(*)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createBooking(payload: { serviceId: string; addressId: string; date: string; time: string; notes?: string }) {
  const client = requireSupabaseClient()
  const { data, error } = await client.rpc('create_booking', {
    p_service_id: payload.serviceId,
    p_address_id: payload.addressId,
    p_booking_date: payload.date,
    p_booking_time: payload.time,
    p_notes: payload.notes ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}
