import { ArrowUpRight, Clock3, MapPin, Plus, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Service } from '../data/services'
import { useCommerce } from '../context/useCommerce'
import PhotoImage from './PhotoImage'
import { servicePhotos } from '../data/imageCatalog'

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { addToCart } = useCommerce()
  return (
    <article className="service-card">
      <div className={`service-art art-${service.tone}`}>
        <PhotoImage className="service-photo" photo={servicePhotos[service.id]} label={service.name} />
        <Link className="service-art-link" to={`/service/${service.id}`} aria-label={`View ${service.name}`} />
        {service.badge && <span className="service-badge">{service.badge}</span>}
        <span className="service-kind">{service.kind === 'product' ? 'ESSENTIAL' : 'PRO SERVICE'}</span>
      </div>
      <div className="service-card-body">
        <div className="service-name-line">
          <Link to={`/service/${service.id}`} className="service-name">{service.name}</Link>
          <span className="rating"><Star size={13} fill="currentColor" /> {service.rating}</span>
        </div>
        <p className="service-description">{service.description}</p>
        <div className="service-meta">
          <span><Clock3 size={14} /> {service.eta}</span>
          <span><MapPin size={14} /> Near you</span>
        </div>
        <div className="service-card-bottom">
          <p><strong>₹{service.price.toLocaleString('en-IN')}</strong> <span>{service.priceUnit}</span></p>
          {service.kind === 'product'
            ? <button className="round-link" type="button" onClick={() => addToCart(service.id)} aria-label={`Add ${service.name} to cart`}><Plus size={17} /></button>
            : <Link className="round-link" to={`/service/${service.id}`} aria-label={`View ${service.name} details`}><ArrowUpRight size={17} /></Link>}
        </div>
      </div>
    </article>
  )
}
