import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, CalendarDays, CircleAlert, Package, RefreshCw, ShieldCheck, ShoppingBag, Users, Wrench } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'
import { getCurrentProfile, getSession, onAuthStateChange } from '../services/authService'
import { fetchAdminDashboard, type AdminDashboardData } from '../services/adminService'

type AdminState = 'checking' | 'loading' | 'ready' | 'error' | 'forbidden' | 'signed-out'

const numberFormatter = new Intl.NumberFormat('en-IN')
const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

function statusClass(status: string) {
  return `admin-status admin-status-${status.toLowerCase().replaceAll('_', '-')}`
}

export default function Admin() {
  const [adminState, setAdminState] = useState<AdminState>('checking')
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.resolve().then(async () => {
      if (!active) return
      setDashboard(null)
      setError('')
      setAdminState('checking')
      if (!isSupabaseConfigured) {
        setAdminState('error')
        setError('Supabase is not configured. Administrative data is unavailable.')
        return
      }

      try {
        const { data: sessionData, error: sessionError } = await getSession()
        if (sessionError) throw new Error(sessionError.message)
        if (!sessionData.session) {
          setAdminState('signed-out')
          return
        }

        const profile = await getCurrentProfile()
        if (!active) return
        if (!profile) {
          setAdminState('signed-out')
          return
        }
        if (profile.role !== 'admin') {
          setAdminState('forbidden')
          return
        }

        setAdminState('loading')
        const data = await fetchAdminDashboard()
        if (!active) return
        setDashboard(data)
        setAdminState('ready')
      } catch (cause) {
        if (!active) return
        console.error('Could not load the administrator dashboard.', cause)
        setError(cause instanceof Error ? cause.message : 'Unable to load administrator data.')
        setAdminState('error')
      }
    })

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
      setDashboard(null)
      setAdminState(session ? 'checking' : 'signed-out')
      setReloadKey((value) => value + 1)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (adminState === 'signed-out') {
    return <section className="admin-state-page container">
      <div className="admin-state-card"><ShieldCheck size={28} /><h1>Administrator sign-in required</h1><p>Sign in with an authorized SAU administrator account to continue.</p><Link className="button button-primary" to="/login?redirect=%2Fadmin">Sign in</Link></div>
    </section>
  }

  if (adminState === 'forbidden') {
    return <section className="admin-state-page container">
      <div className="admin-state-card"><CircleAlert size={28} /><h1>Administrator access only</h1><p>This account does not have administrator privileges. Customer and partner accounts cannot access this dashboard.</p><Link className="text-link" to="/">Return to SAU <ArrowLeft size={15} /></Link></div>
    </section>
  }

  if (adminState === 'checking' || adminState === 'loading') {
    return <section className="admin-state-page container"><p className="admin-loading" role="status">Verifying administrator access and loading live data…</p></section>
  }

  if (adminState === 'error') {
    return <section className="admin-state-page container">
      <div className="admin-state-card admin-error-card"><CircleAlert size={28} /><h1>Dashboard data unavailable</h1><p role="alert">{error}</p><p>Administrative data is only requested through the signed-in Supabase session and existing row-level security policies. No service-role key or policy bypass is used.</p><button className="button button-primary" type="button" onClick={() => setReloadKey((value) => value + 1)}><RefreshCw size={15} /> Try again</button></div>
    </section>
  }

  if (!dashboard) return null

  return <section className="admin-page container">
    <header className="admin-header">
      <div><span className="section-kicker">SAU SOLUTIONS · ADMINISTRATION</span><h1>Platform overview</h1><p>Live counts and recent activity from the connected marketplace database.</p></div>
      <button className="button button-secondary admin-refresh" type="button" onClick={() => setReloadKey((value) => value + 1)}><RefreshCw size={15} /> Refresh</button>
    </header>

    <div className="admin-metric-grid">
      {dashboard.metrics.map((metric) => {
        const icon = metric.label === 'Customers' || metric.label === 'Partners' ? Users
          : metric.label === 'Bookings' ? CalendarDays
            : metric.label === 'Product orders' ? ShoppingBag
              : metric.label === 'Products' ? Package
                : metric.label === 'Services' ? Wrench : BarChart3
        const Icon = icon
        return <article className="admin-metric-card" key={metric.label}><span><Icon size={18} /></span><div><small>{metric.label}</small><strong>{numberFormatter.format(metric.value)}</strong></div></article>
      })}
    </div>

    <div className="admin-activity-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><span className="section-kicker">SERVICE ACTIVITY</span><h2>Recent bookings</h2></div><span className="admin-panel-icon"><CalendarDays size={17} /></span></div>
        {dashboard.bookings.length === 0 ? <p className="admin-empty">No bookings have been recorded yet.</p> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Booking</th><th>Scheduled</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {dashboard.bookings.map((booking) => <tr key={booking.id}><td><code>{booking.id.slice(0, 8)}</code></td><td>{booking.booking_date} · {booking.booking_time}</td><td>{booking.total_amount === null ? '—' : currencyFormatter.format(booking.total_amount)}</td><td><span className={statusClass(booking.status)}>{booking.status.replaceAll('_', ' ')}</span></td></tr>)}
        </tbody></table></div>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><span className="section-kicker">COMMERCE ACTIVITY</span><h2>Recent product orders</h2></div><span className="admin-panel-icon"><ShoppingBag size={17} /></span></div>
        {dashboard.orders.length === 0 ? <p className="admin-empty">No product orders have been recorded yet.</p> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Created</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead><tbody>
          {dashboard.orders.map((order) => <tr key={order.id}><td><code>{order.id.slice(0, 8)}</code></td><td>{new Date(order.created_at).toLocaleDateString('en-IN')}</td><td>{currencyFormatter.format(order.total_amount)}</td><td><span className={statusClass(order.payment_status)}>{order.payment_status}</span></td><td><span className={statusClass(order.status)}>{order.status.replaceAll('_', ' ')}</span></td></tr>)}
        </tbody></table></div>}
      </section>
    </div>

    <p className="admin-data-note"><ShieldCheck size={15} /> Counts and records come from Supabase with the current administrator session. Booking and order lifecycles remain separate.</p>
  </section>
}
