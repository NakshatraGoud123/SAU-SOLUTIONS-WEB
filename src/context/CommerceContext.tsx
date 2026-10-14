import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Address, Booking, CartLine, CommerceState, Order } from '../data/commerce'
import { requireSupabaseClient, supabase } from '../lib/supabase'
import { onAuthStateChange } from '../services/authService'
import { fetchCart, setCartItemQuantity, upsertCartItem, removeCartItem } from '../services/cartService'
import { fetchProfile } from '../services/profileService'
import { fetchOrders, createOrder as createOrderRecord } from '../services/orderService'
import { fetchBookings, createBooking as createBookingRecord } from '../services/bookingService'
import { fetchNotifications } from '../services/notificationService'
import { CommerceContext, type CommerceContextValue } from './commerce-context'

interface AddressRow {
  id: string
  full_name: string
  phone: string
  address_line: string
  city: string
  postal_code: string
}

interface OrderRow {
  id: string
  status: string
  total_amount: number
  created_at: string
  addresses: AddressRow | null
  order_items: Array<{ product_id: string; quantity: number }>
}

interface BookingRow {
  id: string
  service_id: string
  status: string
  booking_date: string
  booking_time: string
  created_at: string
  addresses: AddressRow | null
}

function mapAddress(row: AddressRow | null): Address | null {
  if (!row) return null
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.address_line,
    city: row.city,
    postalCode: row.postal_code,
  }
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    items: row.order_items.map((item) => ({ serviceId: item.product_id, quantity: item.quantity })),
    address: mapAddress(row.addresses),
    total: Number(row.total_amount),
    createdAt: row.created_at,
    status: row.status,
  }
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    address: mapAddress(row.addresses),
    date: row.booking_date,
    time: row.booking_time,
    createdAt: row.created_at,
    status: row.status,
  }
}

const emptyState: CommerceState = {
  cart: [],
  orders: [],
  bookings: [],
  customer: null,
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommerceState>(emptyState)
  const [notifications, setNotifications] = useState<CommerceContextValue['notifications']>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [loadError, setLoadError] = useState(supabase ? '' : 'Supabase is not configured. Account and marketplace data are unavailable.')

  const loadUserData = useCallback(async (userId: string) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const profile = await fetchProfile(userId)
      if (!profile || profile.user_id !== userId) throw new Error('Your profile is not available.')
      const [cart, orders, bookings, nextNotifications] = await Promise.all([
        fetchCart(userId),
        fetchOrders(userId),
        fetchBookings(userId),
        fetchNotifications(userId),
      ])
      setState({
        customer: { id: userId, name: profile.full_name, email: profile.email, role: profile.role },
        cart,
        orders: (orders as unknown as OrderRow[]).map(mapOrder),
        bookings: (bookings as unknown as BookingRow[]).map(mapBooking),
      })
      setNotifications(nextNotifications)
    } catch (cause) {
      console.error('Could not load the signed-in marketplace data.', cause)
      setState({ ...emptyState, customer: null })
      setNotifications([])
      setLoadError('Unable to load your account data. Please try signing in again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshActivity = useCallback(async () => {
    const userId = state.customer?.id
    if (!userId) return
    try {
      const [orders, bookings, nextNotifications] = await Promise.all([
        fetchOrders(userId),
        fetchBookings(userId),
        fetchNotifications(userId),
      ])
      setState((current) => ({
        ...current,
        orders: (orders as unknown as OrderRow[]).map(mapOrder),
        bookings: (bookings as unknown as BookingRow[]).map(mapBooking),
      }))
      setNotifications(nextNotifications)
    } catch (cause) {
      console.error('Could not refresh marketplace activity.', cause)
      setLoadError('Unable to refresh your activity. Please try again.')
    }
  }, [state.customer?.id])

  useEffect(() => {
    if (!supabase) return

    let active = true
    const applySession = async (userId: string | null) => {
      if (!active) return
      if (!userId) {
        setState(emptyState)
        setNotifications([])
        setIsLoading(false)
        setLoadError('')
        return
      }
      await loadUserData(userId)
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Could not restore the Supabase session.', error)
        setLoadError('Unable to restore your session. Please sign in again.')
        setIsLoading(false)
        return
      }
      void applySession(data.session?.user.id ?? null)
    })

    const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
      void applySession(session?.user.id ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadUserData])

  useEffect(() => {
    if (!supabase || !state.customer) return
    const userId = state.customer.id
    const channel = requireSupabaseClient()
      .channel(`marketplace-updates-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `customer_id=eq.${userId}` }, () => { void refreshActivity() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${userId}` }, () => { void refreshActivity() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => { void refreshActivity() })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Supabase Realtime subscription status: ${status}`)
        }
      })
    return () => {
      void requireSupabaseClient().removeChannel(channel)
    }
  }, [state.customer, refreshActivity])

  const value = useMemo<CommerceContextValue>(() => ({
    ...state,
    isLoading,
    loadError,
    notifications,
    async addToCart(productId) {
      const userId = state.customer?.id
      if (!userId) return 'Sign in to add items to your cart.'
      try {
        await upsertCartItem(userId, productId, 1)
        setState((current) => {
          const found = current.cart.find((line) => line.serviceId === productId)
          const cart: CartLine[] = found
            ? current.cart.map((line) => line.serviceId === productId ? { ...line, quantity: line.quantity + 1 } : line)
            : [...current.cart, { serviceId: productId, quantity: 1 }]
          return { ...current, cart }
        })
        return null
      } catch (cause) {
        console.error('Could not add an item to the cart.', cause)
        return 'Unable to add this item. Please try again.'
      }
    },
    async setCartQuantity(productId, quantity) {
      const userId = state.customer?.id
      if (!userId) return 'Sign in to update your cart.'
      try {
        if (quantity < 1) await removeCartItem(userId, productId)
        else await setCartItemQuantity(userId, productId, quantity)
        setState((current) => ({
          ...current,
          cart: quantity < 1
            ? current.cart.filter((line) => line.serviceId !== productId)
            : current.cart.map((line) => line.serviceId === productId ? { ...line, quantity } : line),
        }))
        return null
      } catch (cause) {
        console.error('Could not update the cart.', cause)
        return 'Unable to update your cart. Please try again.'
      }
    },
    async removeFromCart(productId) {
      const userId = state.customer?.id
      if (!userId) return 'Sign in to update your cart.'
      try {
        await removeCartItem(userId, productId)
        setState((current) => ({ ...current, cart: current.cart.filter((line) => line.serviceId !== productId) }))
        return null
      } catch (cause) {
        console.error('Could not remove the cart item.', cause)
        return 'Unable to remove this item. Please try again.'
      }
    },
    async placeOrder(addressId) {
      const userId = state.customer?.id
      if (!userId) throw new Error('Sign in before placing your order.')
      const orderId = await createOrderRecord(addressId, userId, state.cart)
      void refreshActivity()
      return orderId
    },
    async createBooking(serviceId, addressId, date, time) {
      if (!state.customer) throw new Error('Sign in before booking a service.')
      const bookingId = await createBookingRecord({ serviceId, addressId, date, time })
      void refreshActivity()
      return bookingId
    },
    signIn(customer) {
      setState((current) => ({ ...current, customer }))
    },
    async signOut() {
      const { error } = await requireSupabaseClient().auth.signOut()
      if (error) throw new Error(error.message)
      setState(emptyState)
      setNotifications([])
    },
    refreshActivity,
  }), [state, isLoading, loadError, notifications, refreshActivity])

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}
