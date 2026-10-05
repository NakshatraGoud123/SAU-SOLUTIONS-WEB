import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { type Address } from '../data/commerce'
import { getService } from '../data/services'
import IconGlyph from '../components/IconGlyph'
import { usePreferences } from '../context/usePreferences'

const initialAddress: Address = { fullName: '', phone: '', line1: '', city: '', postalCode: '' }
const timeSlots = ['9:00 AM – 11:00 AM', '12:00 PM – 2:00 PM', '3:00 PM – 5:00 PM', '6:00 PM – 8:00 PM']
const minBookingDate = new Date().toISOString().slice(0, 10)

export default function Booking() {
  const [params] = useSearchParams()
  const serviceId = params.get('service')
  const service = getService(serviceId ?? undefined)
  const { createBooking, customer } = useCommerce()
  const { location } = usePreferences()
  const navigate = useNavigate()
  const [address, setAddress] = useState<Address>({ ...initialAddress, fullName: customer?.name ?? '', city: location?.city ?? '' })
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState('')
  const updateAddress = (field: keyof Address, value: string) => setAddress((current) => ({ ...current, [field]: value }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!service || service.kind !== 'professional') return
    if (!/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setError('')
    const bookingAddress = { ...address, city: address.city || location?.city || '' }
    const booking = createBooking(service.id, bookingAddress, date, time)
    navigate(`/orders?booking=${encodeURIComponent(booking.id)}`)
  }

  if (!service || service.kind !== 'professional') return <div className="container"><div className="empty-state flow-empty"><span><CalendarDays size={22} /></span><h2>Choose a professional service first.</h2><p>Products use your bag and checkout; bookings are just for professional services.</p><Link className="button button-primary" to="/categories">Find a service</Link></div></div>

  return <div className="flow-page container">
    <Link className="back-link" to={`/service/${service.id}`}><ArrowLeft size={15} /> Back to service</Link>
    <div className="flow-heading"><span className="section-kicker">YOUR NEXT GOOD EXPERIENCE</span><h1>Book a service</h1><p>Choose a time and tell us where the professional can find you.</p></div>
    <div className="cart-layout checkout-layout">
      <form className="flow-form" onSubmit={submit}>
        <div className="booking-service-preview"><span className={`cart-product-art art-${service.tone}`}><IconGlyph name={service.icon} size={25} /></span><span><small>BOOKING</small><strong>{service.name}</strong></span><strong>₹{service.price.toLocaleString('en-IN')}</strong></div>
        <h2>Choose a date & time</h2>
        <label className="date-field">Preferred date<input required type="date" min={minBookingDate} value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <fieldset className="time-slots"><legend>Available time slots</legend>{timeSlots.map((slot) => <label key={slot} className={time === slot ? 'time-slot selected' : 'time-slot'}><input type="radio" name="slot" required checked={time === slot} onChange={() => setTime(slot)} />{slot}</label>)}</fieldset>
        <h2>Your address</h2>
        <div className="form-grid">
          <label>Full name<input required autoComplete="name" value={address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} /></label>
          <label>Phone number<input required inputMode="tel" autoComplete="tel" maxLength={14} value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} /></label>
          <label className="field-span">Street address<input required autoComplete="street-address" value={address.line1} onChange={(event) => updateAddress('line1', event.target.value)} /></label>
          <label>City<input required autoComplete="address-level2" value={address.city || location?.city || ''} onChange={(event) => updateAddress('city', event.target.value)} /></label>
          <label>PIN code<input required inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="\d{6}" value={address.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="payment-note"><ShieldCheck size={18} /><span><strong>Trusted, local professionals.</strong><small>This booking request is saved in your browser for this demo.</small></span></div>
        <button className="button button-primary" type="submit">Confirm booking <ArrowRight size={16} /></button>
      </form>
      <aside className="flow-summary"><span className="section-kicker">BOOKING SUMMARY</span><h2>At a glance.</h2><div className="summary-row"><span>Service</span><strong>{service.name}</strong></div><div className="summary-row"><span>Duration</span><strong>{service.eta}</strong></div><div className="summary-total"><span>Starting at</span><strong>₹{service.price.toLocaleString('en-IN')}</strong></div><p className="summary-note"><CheckCircle2 size={14} /> Final pricing is confirmed before work begins.</p></aside>
    </div>
  </div>
}
