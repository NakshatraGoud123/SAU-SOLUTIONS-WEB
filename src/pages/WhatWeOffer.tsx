import { Apple, Bike, HeartPulse, House, Milk, ShoppingBasket, Store, Utensils, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const offerings = [
  { title: 'Local shops and vendors', description: 'Discover neighborhood businesses and the products they may make available through the platform.', icon: Store },
  { title: 'Grocery and daily essentials', description: 'Everyday grocery and household essentials from participating local vendors.', icon: ShoppingBasket },
  { title: 'Fruits and vegetables', description: 'Fresh produce options, depending on participating shops and local availability.', icon: Apple },
  { title: 'Milk and dairy', description: 'Milk and dairy products from participating local suppliers where available.', icon: Milk },
  { title: 'Pharmacy and healthcare products', description: 'Access to eligible pharmacy and healthcare products, subject to applicable laws, licensing, prescriptions and other requirements.', icon: HeartPulse },
  { title: 'Restaurants and food businesses', description: 'Food and beverage options from participating restaurants and local food businesses.', icon: Utensils },
  { title: 'Mechanics and repair services', description: 'Connect with participating mechanics and repair professionals for vehicle-related needs.', icon: Wrench },
  { title: 'Home and personal services', description: 'Explore planned home, maintenance, grooming and personal service categories.', icon: House },
  { title: 'Delivery-partner opportunities', description: 'Independent delivery partners may be part of the platform where delivery opportunities are available.', icon: Bike },
]

export default function WhatWeOffer() {
  return (
    <div className="information-page container">
      <header className="information-heading">
        <span className="section-kicker">WHAT WE OFFER · SAU SERVICES</span>
        <h1>Local essentials and services, <span>in one place.</span></h1>
        <p>SAU SERVICES is being prepared to connect customers with participating local businesses and independent professionals across everyday categories.</p>
      </header>
      <div className="offerings-grid">
        {offerings.map(({ title, description, icon: Icon }) => <article className="ecosystem-card offering-card" key={title}><span><Icon size={21} /></span><h2>{title}</h2><p>{description}</p></article>)}
      </div>
      <section className="information-callout offerings-note">
        <strong>Local availability matters.</strong>
        <p>Products and services depend on the customer’s service area, participating partners, applicable requirements and current availability. These categories do not confirm a live listing or guarantee that any item or service can currently be requested.</p>
        <Link className="text-link" to="/service-area">Read service-area information</Link>
      </section>
    </div>
  )
}
