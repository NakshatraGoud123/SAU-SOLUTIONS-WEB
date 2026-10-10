export type UserRole = 'customer' | 'partner' | 'admin'

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at?: string
  updated_at?: string
}

export interface Category {
  id?: string
  name: string
  slug: string
  description: string
  image_url?: string | null
  is_active?: boolean
  created_at?: string
}

export interface Service {
  id: string
  category_id?: string | null
  name: string
  slug: string
  description: string
  image_url?: string | null
  price: number
  duration?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  category_id?: string | null
  name: string
  slug: string
  description: string
  image_url?: string | null
  price: number
  stock?: number | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Cart {
  id: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  price: number
  created_at?: string
}

export interface Address {
  id?: string
  user_id?: string
  full_name: string
  phone: string
  address_line: string
  city: string
  state?: string | null
  postal_code: string
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

export interface Booking {
  id: string
  customer_id: string
  service_id: string
  partner_id?: string | null
  address_id?: string | null
  booking_date: string
  booking_time: string
  status: 'PENDING' | 'ACCEPTED' | 'ON_THE_WAY' | 'ARRIVED' | 'SERVICE_STARTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  total_amount?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  customer_id: string
  address_id?: string | null
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  total_amount: number
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at?: string
}

export interface Review {
  id: string
  customer_id: string
  service_id?: string | null
  partner_id?: string | null
  rating: number
  comment?: string | null
  created_at?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at?: string
}

export interface PartnerProfile {
  id: string
  user_id: string
  business_name: string
  partner_type?: string | null
  services_offered?: string | null
  experience?: string | null
  address?: string | null
  postal_code?: string | null
  phone: string | null
  profile_image: string | null
  service_area: string | null
  latitude?: number | null
  longitude?: number | null
  availability?: string | null
  rating?: number | null
  created_at?: string
  updated_at?: string
}
