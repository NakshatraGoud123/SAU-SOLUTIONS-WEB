import { Check, Circle, PackageCheck, Truck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { useCatalog } from '../context/useCatalog'

const stages = [
  { label: 'Order placed', statuses: ['PENDING', 'CONFIRMED'] },
  { label: 'Being prepared', statuses: ['PREPARING', 'PROCESSING'] },
  { label: 'On the way', statuses: ['OUT_FOR_DELIVERY'] },
  { label: 'Delivered', statuses: ['DELIVERED'] },
]

export default function Tracking() {
  const [params] = useSearchParams()
  const orderId = params.get('id')
  const { orders, isLoading, loadError } = useCommerce()
  const { services, loading: catalogLoading } = useCatalog()
  const order = orders.find((item) => item.id === orderId)

  if (isLoading || catalogLoading) return <div className="flow-page container"><p role="status">Loading order status…</p></div>
  if (loadError) return <div className="flow-page container"><p className="form-error" role="alert">{loadError}</p></div>
  if (!order) return <div className="container"><div className="empty-state flow-empty"><span><Truck size={22} /></span><h2>No order to track.</h2><p>Once you place an order, you can follow its progress here.</p><Link className="button button-primary" to="/orders">View your activity</Link></div></div>

  const stageIndex = stages.findIndex((stage) => stage.statuses.includes(order.status))
  const cancelled = order.status === 'CANCELLED'
  const productNames = order.items.map((line) => `${services.find((item) => item.id === line.serviceId)?.name ?? 'Item'} × ${line.quantity}`).join(', ')

  return <div className="flow-page container">
    <div className="flow-heading"><span className="section-kicker">ORDER TRACKING</span><h1>{cancelled ? 'This order was cancelled.' : 'Your order status.'}</h1><p>Updates appear here as your order moves through fulfilment.</p></div>
    <section className="tracking-card"><div className="tracking-top"><span className="activity-icon tone-green"><PackageCheck size={22} /></span><div><span className="activity-kind">ORDER {order.id.toUpperCase()}</span><strong>{productNames}</strong></div><span className="tracking-status">{order.status.replaceAll('_', ' ')}</span></div><div className="tracking-timeline">{stages.map((stage, index) => {
      const complete = !cancelled && stageIndex >= index
      return <div className={`tracking-stage ${complete ? 'stage-done' : ''}`} key={stage.label}><span className="stage-icon">{complete ? <Check size={14} /> : <Circle size={12} />}</span><span>{stage.label}</span></div>
    })}</div>{order.address && <div className="tracking-address"><strong>Delivering to</strong><span>{order.address.fullName} · {order.address.phone}</span><span>{order.address.line1}, {order.address.city} {order.address.postalCode}</span></div>}</section>
    <Link className="text-link activity-back" to="/orders">View all orders and bookings <span>→</span></Link>
  </div>
}
