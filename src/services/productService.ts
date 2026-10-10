import { requireSupabaseClient } from '../lib/supabase'

export async function fetchProducts() {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('products').select('*').eq('is_active', true).gt('stock', 0)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchProductsByCategory(categoryId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return data
}
