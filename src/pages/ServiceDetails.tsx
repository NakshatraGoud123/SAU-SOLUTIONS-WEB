import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import { useCommerce } from '../context/useCommerce'
import { useCatalog } from '../context/useCatalog'
import PhotoImage from '../components/PhotoImage'
import { servicePhotos } from '../data/imageCatalog'
import { usePreferences } from '../context/usePreferences'
import { createReview } from '../services/reviewService'

export default function ServiceDetails() {
  const { serviceId } = useParams()
  const { categories, services, loading, error } = useCatalog()
  const service = services.find((item) => item.id === serviceId)
  const [added, setAdded] = useState(false)
  const [actionError, setActionError] = useState('')
  const { addToCart, bookings, customer } = useCommerce()
  const { location } = usePreferences()
  const navigate = useNavigate()
  const [reviewRating, setReviewRating] = useState('5')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  if (loading) return <section className="container"><p role="status">Loading item…</p></section>
  if (error) return <section className="container"><p className="form-error" role="alert">{error}</p></section>
  if (!service) {
    return <section className="container empty-state missing-category"><span><ShieldCheck size={22} /></span><h1>We couldn’t find that service.</h1><p>There are plenty more ways SAU can make your day easier.</p><Link className="button button-primary" to="/categories">Explore services</Link></section>
  }

  const category = categories.find((item) => item.slug === service.categorySlug)
  const related = services.filter((item) => item.categorySlug === service.categorySlug && item.id !== service.id)
  const selectedService = service
  const eligibleToReview = service.kind === 'professional'
    && bookings.some((booking) => booking.serviceId === service.id && booking.status === 'COMPLETED')
  const photo = servicePhotos[service.catalogKey ?? service.id]
    ?? (service.imageUrl ? { src: service.imageUrl, alt: service.name } : undefined)

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!customer || !eligibleToReview) return
    setReviewSaving(true)
    setReviewError('')
    setReviewMessage('')
    try {
      await createReview({
        customer_id: customer.id,
        service_id: selectedService.id,
        partner_id: null,
        rating: Number(reviewRating),
        comment: reviewComment.trim() || null,
      })
      setReviewMessage('Thank you. Your review has been saved.')
      setReviewComment('')
    } catch (cause) {
      console.error('Could not save the service review.', cause)
      setReviewError('Unable to save your review. You may already have reviewed this service.')
    } finally {
      setReviewSaving(false)
    }
  }

  async function addProductToCart() {
    if (!customer) {
      navigate('/login')
      return
    }

    const result = await addToCart(selectedService.id)
    setActionError(result ?? '')
    setAdded(!result)
  }

  return (
    <div className="listing-page detail-page">
      <section className="container service-detail-layout">
        <div className="service-detail-main">
          <Link className="back-link" to={`/category/${service.categorySlug}`}><ArrowLeft size={15} /> {category?.name ?? 'Back to category'}</Link>
          <PhotoImage className="detail-art" photo={photo} label={service.name} loading="eager" />
          <span className="section-kicker">{service.kind === 'product' ? 'EVERYDAY ESSENTIAL' : 'A SAU VERIFIED PROFESSIONAL'}</span>
          <h1>{service.name}</h1>
          <p className="detail-description">{service.description}</p>
          {service.rating > 0 && <div className="detail-rating"><span><Star size={15} fill="currentColor" /> {service.rating}</span><span>{service.reviews} thoughtful reviews</span></div>}
          <div className="detail-benefits"><div><span><ShieldCheck size={18} /></span><div><strong>Carefully vetted</strong><small>Trusted by your neighbourhood</small></div></div><div><span><Clock3 size={18} /></span><div><strong>{service.eta}</strong><small>Choose a time that works for you</small></div></div><div><span><MapPin size={18} /></span><div><strong>Available nearby</strong><small>{location ? `Serving ${location.label}` : 'Choose your area to see nearby availability'}</small></div></div></div>
        </div>
        <aside className="booking-card">
          <span className="booking-label">{service.kind === 'product' ? 'A GOOD THING TO HAVE' : 'YOUR NEXT GOOD EXPERIENCE'}</span>
          <h2>Thoughtfully taken care of.</h2>
          <p>Clear details, reliable help, and a little more peace of mind — all in one place.</p>
          <div className="booking-price"><strong>₹{service.price.toLocaleString('en-IN')}</strong><span>{service.priceUnit}</span></div>
          {service.kind === 'product' ? <div className="purchase-actions"><button className="button button-primary booking-button" onClick={() => void addProductToCart()}>{added ? <><Check size={17} /> Added to your bag</> : <>Add to bag <ArrowLeft className="button-arrow-right" size={17} /></>}</button>{added && <Link className="text-link" to="/cart">Go to cart <ArrowLeft className="reverse-arrow" size={14} /></Link>}{actionError && <p className="form-error" role="alert">{actionError}</p>}</div>
            : <button className="button button-primary booking-button" onClick={() => navigate(`/booking?service=${encodeURIComponent(service.id)}`)}>Select date & book <ArrowLeft className="button-arrow-right" size={17} /></button>}
          <div className="booking-assurance"><ShieldCheck size={16} /> No surprises. Just SAU.</div>
        </aside>
      </section>
      {eligibleToReview && <section className="container flow-form">
        <h2>Share your experience</h2>
        <form onSubmit={(event) => void submitReview(event)}>
          <label>Rating<select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}</select></label>
          <label>Your review<textarea rows={4} maxLength={1000} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="What should other customers know?" /></label>
          {reviewError && <p className="form-error" role="alert">{reviewError}</p>}
          {reviewMessage && <p className="form-success" role="status">{reviewMessage}</p>}
          <button className="button button-primary" type="submit" disabled={reviewSaving}>{reviewSaving ? 'Saving review…' : 'Submit review'}</button>
        </form>
      </section>}
      {related.length > 0 && <section className="container related-service-section"><div className="section-heading compact-heading"><div><span className="section-kicker">A FEW MORE GOOD OPTIONS</span><h2>More in {category?.name}</h2></div><Link to={`/category/${service.categorySlug}`} className="text-link">View all <ArrowLeft className="reverse-arrow" size={15} /></Link></div><div className="service-grid">{related.map((item) => <ServiceCard key={item.id} service={item} />)}</div></section>}
    </div>
  )
}
