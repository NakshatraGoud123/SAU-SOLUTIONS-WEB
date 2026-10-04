import { createContext } from 'react'
import type { Address, Booking, CommerceState, Customer, Order } from '../data/commerce'

export interface CommerceContextValue extends CommerceState {
  addToCart: (serviceId: string) => void
  setCartQuantity: (serviceId: string, quantity: number) => void
  removeFromCart: (serviceId: string) => void
  placeOrder: (address: Address) => Order
  createBooking: (serviceId: string, address: Address, date: string, time: string) => Booking
  signIn: (customer: Customer) => void
  signOut: () => void
}

export const CommerceContext = createContext<CommerceContextValue | null>(null)
