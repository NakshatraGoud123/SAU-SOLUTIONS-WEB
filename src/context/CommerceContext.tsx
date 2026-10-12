import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { emptyCommerceState, type Booking, type CommerceState, type Order } from '../data/commerce'
import { getService } from '../data/services'
import { CommerceContext, type CommerceContextValue } from './commerce-context'

const STORAGE_KEY = 'sau-commerce-v1'

function readSavedState(): CommerceState {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return emptyCommerceState

  try {
    const parsed = JSON.parse(saved) as Partial<CommerceState>
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      customer: parsed.customer ?? null,
    }
  } catch (error) {
    console.error('Could not read saved SAU marketplace data.', error)
    localStorage.removeItem(STORAGE_KEY)
    return emptyCommerceState
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommerceState>(readSavedState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<CommerceContextValue>(() => ({
    ...state,
    addToCart(serviceId) {
      const service = getService(serviceId)
      if (!service || service.kind !== 'product') return
      setState((current) => {
        const existing = current.cart.find((line) => line.serviceId === serviceId)
        const cart = existing
          ? current.cart.map((line) => line.serviceId === serviceId ? { ...line, quantity: line.quantity + 1 } : line)
          : [...current.cart, { serviceId, quantity: 1 }]
        return { ...current, cart }
      })
    },
    setCartQuantity(serviceId, quantity) {
      setState((current) => ({
        ...current,
        cart: quantity < 1
          ? current.cart.filter((line) => line.serviceId !== serviceId)
          : current.cart.map((line) => line.serviceId === serviceId ? { ...line, quantity } : line),
      }))
    },
    removeFromCart(serviceId) {
      setState((current) => ({ ...current, cart: current.cart.filter((line) => line.serviceId !== serviceId) }))
    },
    placeOrder(address) {
      const order: Order = {
        id: createId('order'),
        items: state.cart,
        address,
        total: state.cart.reduce((sum, line) => sum + (getService(line.serviceId)?.price ?? 0) * line.quantity, 0),
        createdAt: new Date().toISOString(),
        status: 'Confirmed',
      }
      setState((current) => ({ ...current, cart: [], orders: [order, ...current.orders] }))
      return order
    },
    createBooking(serviceId, address, date, time) {
      const booking: Booking = {
        id: createId('booking'),
        serviceId,
        address,
        date,
        time,
        createdAt: new Date().toISOString(),
        status: 'Confirmed',
      }
      setState((current) => ({ ...current, bookings: [booking, ...current.bookings] }))
      return booking
    },
    signIn(customer) {
      setState((current) => ({ ...current, customer }))
    },
    signOut() {
      setState((current) => ({ ...current, customer: null }))
    },
  }), [state])

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}
