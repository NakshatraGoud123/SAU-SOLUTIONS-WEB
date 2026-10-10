import { requireSupabaseClient } from '../lib/supabase'

export async function fetchCart(userId: string) {
  const client = requireSupabaseClient()
  const cartResult = await client.from('carts').select('id').eq('user_id', userId).maybeSingle()
  if (cartResult.error) throw new Error(cartResult.error.message)
  if (!cartResult.data) return []

  const itemResult = await client.from('cart_items').select('product_id, quantity').eq('cart_id', cartResult.data.id)
  if (itemResult.error) throw new Error(itemResult.error.message)
  return itemResult.data.map((item) => ({ serviceId: item.product_id, quantity: item.quantity }))
}

export async function upsertCartItem(userId: string, productId: string, quantity: number) {
  const client = requireSupabaseClient()

  const { data: product, error: productError } = await client.from('products').select('price, is_active, stock').eq('id', productId).single()
  if (productError) throw new Error(productError.message)
  if (!product.is_active || product.stock < quantity) throw new Error('This item is not available in the requested quantity.')

  const cartResult = await client.from('carts')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single()
  if (cartResult.error) throw new Error(cartResult.error.message)

  const existingItem = await client.from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartResult.data.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existingItem.error && existingItem.error.code !== 'PGRST116') throw new Error(existingItem.error.message)

  if (existingItem.data) {
    const nextQuantity = existingItem.data.quantity + quantity
    if (product.stock < nextQuantity) throw new Error('There is not enough stock for that quantity.')
    const { data, error } = await client.from('cart_items')
      .update({ quantity: nextQuantity, price: product.price })
      .eq('id', existingItem.data.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await client.from('cart_items')
    .insert({ cart_id: cartResult.data.id, product_id: productId, quantity, price: product.price })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function setCartItemQuantity(userId: string, productId: string, quantity: number) {
  const client = requireSupabaseClient()
  const { data: cart, error: cartError } = await client.from('carts').select('id').eq('user_id', userId).single()
  if (cartError) throw new Error(cartError.message)

  if (quantity < 1) {
    const { error } = await client.from('cart_items').delete().eq('cart_id', cart.id).eq('product_id', productId)
    if (error) throw new Error(error.message)
    return
  }

  const { data: product, error: productError } = await client.from('products').select('price, stock, is_active').eq('id', productId).single()
  if (productError) throw new Error(productError.message)
  if (!product.is_active || product.stock < quantity) throw new Error('There is not enough stock for that quantity.')

  const { error } = await client.from('cart_items')
    .update({ quantity, price: product.price })
    .eq('cart_id', cart.id)
    .eq('product_id', productId)

  if (error) throw new Error(error.message)
}

export async function removeCartItem(userId: string, productId: string) {
  await setCartItemQuantity(userId, productId, 0)
}

export async function clearCart(userId: string) {
  const client = requireSupabaseClient()
  const { data: cart, error: cartError } = await client.from('carts').select('id').eq('user_id', userId).maybeSingle()
  if (cartError) throw new Error(cartError.message)
  if (!cart) return
  const { error } = await client.from('cart_items').delete().eq('cart_id', cart.id)
  if (error) throw new Error(error.message)
}
