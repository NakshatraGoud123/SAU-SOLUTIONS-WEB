import { ArrowUpRight, Plus } from 'lucide-react'
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
        <span className="service-kind">{service.kind === 'product' ? 'DEMO PRODUCT' : 'DEMO SERVICE'}</span>
      </div>
      <div className="service-card-body">
        <div className="service-name-line">
          <Link to={`/service/${service.id}`} className="service-name">{service.name}</Link>
        </div>
        <p className="service-description">{service.description}</p>
        <div className="service-meta">
          <span>Illustrative details</span>
          <span>Not a live offer</span>
        </div>
        <div className="service-card-bottom">
          <p><strong>₹{service.price.toLocaleString('en-IN')}</strong> <span>example price · {service.priceUnit}</span></p>
          {service.kind === 'product'
            ? <button className="round-link" type="button" onClick={() => addToCart(service.id)} aria-label={`Add ${service.name} to cart`}><Plus size={17} /></button>
            : <Link className="round-link" to={`/service/${service.id}`} aria-label={`View ${service.name} details`}><ArrowUpRight size={17} /></Link>}
        </div>
      </div>
    </article>
  )
}
