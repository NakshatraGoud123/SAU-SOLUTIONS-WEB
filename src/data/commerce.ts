import type { Service } from './services'

export interface CartLine {
  serviceId: string
  quantity: number
}

export interface Address {
  fullName: string
  phone: string
  line1: string
  city: string
  postalCode: string
}

export interface Order {
  id: string
  items: CartLine[]
  address: Address
  total: number
  createdAt: string
  status: 'Confirmed' | 'Preparing' | 'On the way' | 'Delivered'
}

export interface Booking {
  id: string
  serviceId: string
  address: Address
  date: string
  time: string
  createdAt: string
  status: 'Confirmed' | 'Professional assigned' | 'Completed'
}

export interface Customer {
  name: string
  email: string
  role?: 'customer' | 'partner'
}

export interface CommerceState {
  cart: CartLine[]
  orders: Order[]
  bookings: Booking[]
  customer: Customer | null
}

export const emptyCommerceState: CommerceState = {
  cart: [],
  orders: [],
  bookings: [],
  customer: null,
}

export function getCartTotal(cart: CartLine[], findService: (id: string) => Service | undefined) {
  return cart.reduce((total, line) => total + (findService(line.serviceId)?.price ?? 0) * line.quantity, 0)
}
