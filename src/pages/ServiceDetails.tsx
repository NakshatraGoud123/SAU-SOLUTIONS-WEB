import { useState } from 'react'
import { ArrowLeft, Check, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import { getCategory } from '../data/categories'
import { getService, getServicesForCategory } from '../data/services'
import { useCommerce } from '../context/useCommerce'
import PhotoImage from '../components/PhotoImage'
import { servicePhotos } from '../data/imageCatalog'
import { usePreferences } from '../context/usePreferences'

export default function ServiceDetails() {
  const { serviceId } = useParams()
  const service = getService(serviceId)
  const [added, setAdded] = useState(false)
  const { addToCart } = useCommerce()
  const { location } = usePreferences()
  const navigate = useNavigate()

  if (!service) {
    return <section className="container empty-state missing-category"><span><ShieldCheck size={22} /></span><h1>We couldn’t find that service.</h1><p>There are plenty more ways SAU can make your day easier.</p><Link className="button button-primary" to="/categories">Explore services</Link></section>
  }

  const category = getCategory(service.categorySlug)
  const related = getServicesForCategory(service.categorySlug).filter((item) => item.id !== service.id)

  return (
    <div className="listing-page detail-page">
      <section className="container service-detail-layout">
        <div className="service-detail-main">
          <Link className="back-link" to={`/category/${service.categorySlug}`}><ArrowLeft size={15} /> {category?.name ?? 'Back to category'}</Link>
          <PhotoImage className="detail-art" photo={servicePhotos[service.id]} label={service.name} loading="eager" />
          <span className="section-kicker">{service.kind === 'product' ? 'EVERYDAY ESSENTIAL' : 'A SAU VERIFIED PROFESSIONAL'}</span>
          <h1>{service.name}</h1>
          <p className="detail-description">{service.description}</p>
          <div className="detail-rating"><span><Star size={15} fill="currentColor" /> {service.rating}</span><span>{service.reviews} thoughtful reviews</span></div>
          <div className="detail-benefits"><div><span><ShieldCheck size={18} /></span><div><strong>Carefully vetted</strong><small>Trusted by your neighbourhood</small></div></div><div><span><Clock3 size={18} /></span><div><strong>{service.eta}</strong><small>Choose a time that works for you</small></div></div><div><span><MapPin size={18} /></span><div><strong>Available nearby</strong><small>{location ? `Serving ${location.label}` : 'Choose your area to see nearby availability'}</small></div></div></div>
        </div>
        <aside className="booking-card">
          <span className="booking-label">{service.kind === 'product' ? 'A GOOD THING TO HAVE' : 'YOUR NEXT GOOD EXPERIENCE'}</span>
          <h2>Thoughtfully taken care of.</h2>
          <p>Clear details, reliable help, and a little more peace of mind — all in one place.</p>
          <div className="booking-price"><strong>₹{service.price.toLocaleString('en-IN')}</strong><span>{service.priceUnit}</span></div>
          {service.kind === 'product' ? <div className="purchase-actions"><button className="button button-primary booking-button" onClick={() => { addToCart(service.id); setAdded(true) }}>{added ? <><Check size={17} /> Added to your bag</> : <>Add to bag <ArrowLeft className="button-arrow-right" size={17} /></>}</button>{added && <Link className="text-link" to="/cart">Go to cart <ArrowLeft className="reverse-arrow" size={14} /></Link>}</div>
            : <button className="button button-primary booking-button" onClick={() => navigate(`/booking?service=${encodeURIComponent(service.id)}`)}>Select date & book <ArrowLeft className="button-arrow-right" size={17} /></button>}
          <div className="booking-assurance"><ShieldCheck size={16} /> No surprises. Just SAU.</div>
        </aside>
      </section>
      {related.length > 0 && <section className="container related-service-section"><div className="section-heading compact-heading"><div><span className="section-kicker">A FEW MORE GOOD OPTIONS</span><h2>More in {category?.name}</h2></div><Link to={`/category/${service.categorySlug}`} className="text-link">View all <ArrowLeft className="reverse-arrow" size={15} /></Link></div><div className="service-grid">{related.map((item) => <ServiceCard key={item.id} service={item} />)}</div></section>}
    </div>
  )
}
