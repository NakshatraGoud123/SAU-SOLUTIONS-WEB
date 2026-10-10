import { createContext } from 'react'
import type { CommerceState, Customer } from '../data/commerce'

export interface CommerceContextValue extends CommerceState {
  isLoading: boolean
  loadError: string
  notifications: Array<{ id: string; title: string; message: string; type: string; is_read: boolean; created_at: string }>
  addToCart: (productId: string) => Promise<string | null>
  setCartQuantity: (productId: string, quantity: number) => Promise<string | null>
  removeFromCart: (productId: string) => Promise<string | null>
  placeOrder: (addressId: string) => Promise<string>
  createBooking: (serviceId: string, addressId: string, date: string, time: string) => Promise<string>
  signIn: (customer: Customer) => void
  signOut: () => Promise<void>
  refreshActivity: () => Promise<void>
}

export const CommerceContext = createContext<CommerceContextValue | null>(null)
