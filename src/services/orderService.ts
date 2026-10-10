import { requireSupabaseClient } from '../lib/supabase'

export async function fetchOrders(userId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('orders')
    .select('*, order_items(*, products(name, slug)), addresses(*)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createOrder(addressId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client.rpc('create_order_from_cart', { p_address_id: addressId })
  if (error) throw new Error(error.message)
  return data as string
}
