import { requireSupabaseClient } from '../lib/supabase'
import type { Review } from '../types'

export async function fetchMyReviews(userId: string): Promise<Review[]> {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('reviews').select('*').eq('customer_id', userId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Review[]
}

export async function createReview(payload: Pick<Review, 'customer_id' | 'service_id' | 'partner_id' | 'rating' | 'comment'>) {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('reviews').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as Review
}
