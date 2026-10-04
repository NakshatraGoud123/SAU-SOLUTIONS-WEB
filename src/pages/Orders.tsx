import { ArrowRight, CalendarDays, PackageCheck, ReceiptText } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { getService } from '../data/services'

export default function Orders() {
  const { orders, bookings } = useCommerce()
  const [params] = useSearchParams()
  const highlightedBooking = params.get('booking')

  return <div className="flow-page container">
    <div className="flow-heading"><span className="section-kicker">YOUR SAU ACTIVITY</span><h1>Orders & bookings</h1><p>Keep track of the essentials and services you’ve arranged.</p></div>
    {orders.length === 0 && bookings.length === 0 ? <div className="empty-state flow-empty"><span><ReceiptText size={22} /></span><h2>Nothing on the list yet.</h2><p>Your orders and service bookings will show up here.</p><Link className="button button-primary" to="/categories">Explore SAU <ArrowRight size={15} /></Link></div> : <div className="activity-list">
      {bookings.map((booking) => {
        const service = getService(booking.serviceId)
        return <article className={`activity-card ${booking.id === highlightedBooking ? 'activity-highlighted' : ''}`} key={booking.id}><span className={`activity-icon art-${service?.tone ?? 'blue'}`}><CalendarDays size={21} /></span><div className="activity-info"><span className="activity-kind">SERVICE BOOKING · {booking.status}</span><strong>{service?.name ?? 'Professional service'}</strong><span>{booking.date} · {booking.time}</span><span>{booking.address.line1}, {booking.address.city}</span></div><span className="activity-price">{service ? `₹${service.price.toLocaleString('en-IN')}` : ''}</span></article>
      })}
      {orders.map((order) => <article className="activity-card" key={order.id}><span className="activity-icon tone-green"><PackageCheck size={21} /></span><div className="activity-info"><span className="activity-kind">ORDER · {order.status}</span><strong>{order.items.map((line) => `${getService(line.serviceId)?.name ?? 'Item'} × ${line.quantity}`).join(', ')}</strong><span>Placed {new Date(order.createdAt).toLocaleString()}</span><span>Delivering to {order.address.line1}, {order.address.city}</span></div><div className="activity-end"><span className="activity-price">₹{order.total.toLocaleString('en-IN')}</span><Link to={`/tracking?id=${encodeURIComponent(order.id)}`}>Track order <ArrowRight size={14} /></Link></div></article>)}
    </div>}
  </div>
}
