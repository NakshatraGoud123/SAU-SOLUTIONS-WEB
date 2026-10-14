import { requireSupabaseClient } from '../lib/supabase'

export interface AdminMetric {
  label: string
  value: number
}

export interface AdminBookingSummary {
  id: string
  booking_date: string
  booking_time: string
  status: string
  total_amount: number | null
  created_at: string
}

export interface AdminOrderSummary {
  id: string
  status: string
  total_amount: number
  payment_status: string
  created_at: string
}

export interface AdminDashboardData {
  metrics: AdminMetric[]
  bookings: AdminBookingSummary[]
  orders: AdminOrderSummary[]
}

async function countRows(table: string, role?: string) {
  const client = requireSupabaseClient()
  let query = client.from(table).select('id', { count: 'exact', head: true })
  if (role) query = query.eq('role', role)
  const { count, error } = await query
  if (error) throw new Error(`Could not count ${table}: ${error.message}`)
  if (count === null) throw new Error(`Supabase did not return a count for ${table}.`)
  return count
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const client = requireSupabaseClient()
  const [
    customerCount,
    partnerCount,
    categoryCount,
    serviceCount,
    productCount,
    bookingCount,
    orderCount,
    bookingsResult,
    ordersResult,
  ] = await Promise.all([
    countRows('profiles', 'customer'),
    countRows('partner_profiles'),
    countRows('categories'),
    countRows('services'),
    countRows('products'),
    countRows('bookings'),
    countRows('orders'),
    client.from('bookings')
      .select('id, booking_date, booking_time, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    client.from('orders')
      .select('id, status, total_amount, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (bookingsResult.error) throw new Error(`Could not load recent bookings: ${bookingsResult.error.message}`)
  if (ordersResult.error) throw new Error(`Could not load recent orders: ${ordersResult.error.message}`)

  return {
    metrics: [
      { label: 'Customers', value: customerCount },
      { label: 'Partners', value: partnerCount },
      { label: 'Bookings', value: bookingCount },
      { label: 'Product orders', value: orderCount },
      { label: 'Categories', value: categoryCount },
      { label: 'Services', value: serviceCount },
      { label: 'Products', value: productCount },
    ],
    bookings: bookingsResult.data,
    orders: ordersResult.data,
  }
}
