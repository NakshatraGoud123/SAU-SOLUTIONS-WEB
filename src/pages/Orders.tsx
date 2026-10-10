import { ArrowRight, CalendarDays, PackageCheck, ReceiptText } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { useCatalog } from '../context/useCatalog'

export default function Orders() {
  const { orders, bookings, isLoading, loadError } = useCommerce()
  const { services, loading: catalogLoading, error: catalogError } = useCatalog()
  const [params] = useSearchParams()
  const highlightedBooking = params.get('booking')

  if (isLoading || catalogLoading) return <div className="flow-page container"><p role="status">Loading your activity…</p></div>

  return <div className="flow-page container">
    <div className="flow-heading"><span className="section-kicker">YOUR SAU ACTIVITY</span><h1>Orders & bookings</h1><p>Keep track of the essentials and services you’ve arranged.</p></div>
    {(loadError || catalogError) && <p className="form-error" role="alert">{loadError || catalogError}</p>}
    {orders.length === 0 && bookings.length === 0 ? <div className="empty-state flow-empty"><span><ReceiptText size={22} /></span><h2>Nothing on the list yet.</h2><p>Your orders and service bookings will show up here.</p><Link className="button button-primary" to="/categories">Explore SAU <ArrowRight size={15} /></Link></div> : <div className="activity-list">
      {bookings.map((booking) => {
        const service = services.find((item) => item.id === booking.serviceId)
        return <article className={`activity-card ${booking.id === highlightedBooking ? 'activity-highlighted' : ''}`} key={booking.id}><span className={`activity-icon art-${service?.tone ?? 'blue'}`}><CalendarDays size={21} /></span><div className="activity-info"><span className="activity-kind">SERVICE BOOKING · {booking.status.replaceAll('_', ' ')}</span><strong>{service?.name ?? 'Professional service'}</strong><span>{booking.date} · {booking.time}</span><span>{booking.address ? `${booking.address.line1}, ${booking.address.city}` : 'Address unavailable'}</span></div><span className="activity-price">{service ? `₹${service.price.toLocaleString('en-IN')}` : ''}</span></article>
      })}
      {orders.map((order) => <article className="activity-card" key={order.id}><span className="activity-icon tone-green"><PackageCheck size={21} /></span><div className="activity-info"><span className="activity-kind">ORDER · {order.status.replaceAll('_', ' ')}</span><strong>{order.items.map((line) => `${services.find((item) => item.id === line.serviceId)?.name ?? 'Item'} × ${line.quantity}`).join(', ')}</strong><span>Placed {new Date(order.createdAt).toLocaleString()}</span><span>{order.address ? `Delivering to ${order.address.line1}, ${order.address.city}` : 'Delivery address unavailable'}</span></div><div className="activity-end"><span className="activity-price">₹{order.total.toLocaleString('en-IN')}</span><Link to={`/tracking?id=${encodeURIComponent(order.id)}`}>Track order <ArrowRight size={14} /></Link></div></article>)}
    </div>}
  </div>
}
