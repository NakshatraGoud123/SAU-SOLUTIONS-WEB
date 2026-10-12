import { Check, Circle, PackageCheck, Truck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { getService } from '../data/services'

const stages = ['Order placed', 'Being prepared', 'On the way', 'Delivered']

export default function Tracking() {
  const [params] = useSearchParams()
  const orderId = params.get('id')
  const { orders } = useCommerce()
  const order = orders.find((item) => item.id === orderId) ?? orders[0]

  if (!order) return <div className="container"><div className="empty-state flow-empty"><span><Truck size={22} /></span><h2>No order to track.</h2><p>Once you place an order, you can follow its progress here.</p><Link className="button button-primary" to="/orders">View your activity</Link></div></div>

  return <div className="flow-page container">
    <div className="flow-heading"><span className="section-kicker">ORDER TRACKING</span><h1>Your order is confirmed.</h1><p>We’ve saved this demo order. Live delivery updates will be available when connected to the SAU fulfilment service.</p></div>
    <section className="tracking-card"><div className="tracking-top"><span className="activity-icon tone-green"><PackageCheck size={22} /></span><div><span className="activity-kind">ORDER {order.id.toUpperCase()}</span><strong>{order.items.map((line) => `${getService(line.serviceId)?.name ?? 'Item'} × ${line.quantity}`).join(', ')}</strong></div><span className="tracking-status">{order.status}</span></div><div className="tracking-timeline">{stages.map((stage, index) => <div className={`tracking-stage ${index === 0 ? 'stage-done' : ''}`} key={stage}><span className="stage-icon">{index === 0 ? <Check size={14} /> : <Circle size={12} />}</span><span>{stage}</span></div>)}</div><div className="tracking-address"><strong>Delivering to</strong><span>{order.address.fullName} · {order.address.phone}</span><span>{order.address.line1}, {order.address.city} {order.address.postalCode}</span></div></section>
    <Link className="text-link activity-back" to="/orders">View all orders and bookings <span>→</span></Link>
  </div>
}
