import { ArrowRight, LogOut, UserRound } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'

export default function Profile() {
  const { customer, signOut, orders, bookings } = useCommerce()

  if (!customer) return <Navigate to="/login" replace />

  return <div className="flow-page container">
    <div className="flow-heading"><span className="section-kicker">YOUR SAU PROFILE</span><h1>A little more personal.</h1><p>Manage your demo profile and find your recent activity.</p></div>
    <section className="profile-card"><span className="profile-avatar"><UserRound size={28} /></span><div className="profile-data"><span className="activity-kind">{customer.role === 'partner' ? 'SAU PARTNER PROFILE · DEMO' : 'SAU MEMBER'}</span><strong>{customer.name}</strong><span>{customer.email}</span></div><button className="button button-outline" onClick={() => { signOut(); }}><LogOut size={15} /> Sign out</button></section>
    <div className="profile-shortcuts"><Link to="/orders"><span><strong>{orders.length}</strong><small>Orders</small></span><span>View your order history <ArrowRight size={15} /></span></Link><Link to="/orders"><span><strong>{bookings.length}</strong><small>Bookings</small></span><span>View your bookings <ArrowRight size={15} /></span></Link></div>
  </div>
}
