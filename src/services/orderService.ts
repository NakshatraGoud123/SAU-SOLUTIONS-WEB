import { requireSupabaseClient } from '../lib/supabase'
import type { CartLine } from '../data/commerce'

async function getCheckoutAttemptId(userId: string, addressId: string, items: CartLine[]) {
  const stableItems = items
    .map(({ serviceId, quantity }) => ({ serviceId, quantity }))
    .sort((left, right) => left.serviceId.localeCompare(right.serviceId))
  const payload = JSON.stringify({ version: 1, userId, addressId, items: stableItems })
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  const bytes = new Uint8Array(digest).slice(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x80
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function fetchOrders(userId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('orders')
    .select('*, order_items(*, products(name, slug)), addresses(*)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createOrder(addressId: string, userId: string, items: CartLine[]) {
  const client = requireSupabaseClient()
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure checkout attempt IDs are unavailable in this browser.')
  }
  const checkoutAttemptId = await getCheckoutAttemptId(userId, addressId, items)
  const { data, error } = await client.rpc('create_order_from_cart', {
    p_address_id: addressId,
    p_checkout_attempt_id: checkoutAttemptId,
  })
  if (error) throw new Error(error.message)
  if (typeof data !== 'string') throw new Error('The checkout response did not include an order ID.')
  return data
}
