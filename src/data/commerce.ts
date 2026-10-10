import type { Service } from './services'

export interface CartLine {
  serviceId: string
  quantity: number
}

export interface Address {
  id?: string
  fullName: string
  phone: string
  line1: string
  city: string
  postalCode: string
}

export interface Order {
  id: string
  items: CartLine[]
  address: Address | null
  total: number
  createdAt: string
  status: string
}

export interface Booking {
  id: string
  serviceId: string
  address: Address | null
  date: string
  time: string
  createdAt: string
  status: string
}

export interface Customer {
  id: string
  name: string
  email: string
  role?: 'customer' | 'partner' | 'admin'
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
