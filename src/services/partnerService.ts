import { requireSupabaseClient } from '../lib/supabase'
import type { PartnerProfile } from '../types'

export interface PartnerProfileInput {
  businessName: string
  partnerType: string
  servicesOffered: string
  experience: string
  address: string
  postalCode: string
  phone: string
  serviceArea: string
  latitude: number
  longitude: number
  availability: string
  photo?: File | null
}

export interface PartnerJob {
  id: string
  service_name: string
  service_slug: string
  category_slug: string | null
  booking_date: string
  booking_time: string
  total_amount: number | null
  status: PartnerBookingStatus | 'PENDING'
}

export type PartnerBookingStatus = 'ACCEPTED' | 'ON_THE_WAY' | 'ARRIVED' | 'SERVICE_STARTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

export async function fetchOwnPartnerProfile(userId: string): Promise<PartnerProfile | null> {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('partner_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data as PartnerProfile | null
}

export async function savePartnerProfile(userId: string, input: PartnerProfileInput): Promise<PartnerProfile> {
  const client = requireSupabaseClient()
  const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('user_id', userId).single()
  if (profileError) throw new Error(profileError.message)
  if (profile.role !== 'partner') throw new Error('Create a partner account before submitting your partner profile.')

  let profileImage: string | null = null
  if (input.photo) {
    const extension = input.photo.name.split('.').at(-1)?.toLowerCase() || 'jpg'
    const path = `${userId}/profile.${extension}`
    const { error: uploadError } = await client.storage.from('partner-avatars').upload(path, input.photo, { upsert: true, contentType: input.photo.type })
    if (uploadError) throw new Error(uploadError.message)
    const { data } = client.storage.from('partner-avatars').getPublicUrl(path)
    profileImage = data.publicUrl
  }

  const { data, error } = await client.from('partner_profiles')
    .upsert({
      user_id: userId,
      business_name: input.businessName,
      partner_type: input.partnerType,
      services_offered: input.servicesOffered,
      experience: input.experience,
      address: input.address,
      postal_code: input.postalCode,
      phone: input.phone,
      profile_image: profileImage,
      service_area: input.serviceArea,
      latitude: input.latitude,
      longitude: input.longitude,
      availability: input.availability,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as PartnerProfile
}

export async function fetchAvailablePartnerBookings(): Promise<PartnerJob[]> {
  const client = requireSupabaseClient()
  const { data, error } = await client.rpc('get_available_partner_bookings')
  if (error) throw new Error(error.message)
  return data as PartnerJob[]
}

export async function fetchPartnerBookings(): Promise<PartnerJob[]> {
  const client = requireSupabaseClient()
  const { data, error } = await client.rpc('get_partner_bookings')
  if (error) throw new Error(error.message)
  return data as PartnerJob[]
}

export async function updatePartnerBookingStatus(bookingId: string, status: PartnerBookingStatus) {
  const client = requireSupabaseClient()
  const { data, error } = await client.rpc('update_partner_booking_status', {
    p_booking_id: bookingId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  return data as string
}
