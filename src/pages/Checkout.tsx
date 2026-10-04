import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { getCartTotal, type Address } from '../data/commerce'
import { getService } from '../data/services'

const emptyAddress: Address = { fullName: '', phone: '', line1: '', city: 'Jaipur', postalCode: '' }

export default function Checkout() {
  const { cart, placeOrder, customer } = useCommerce()
  const navigate = useNavigate()
  const [address, setAddress] = useState<Address>({ ...emptyAddress, fullName: customer?.name ?? '' })
  const [error, setError] = useState('')
  const total = getCartTotal(cart, (id) => getService(id))
  const updateAddress = (field: keyof Address, value: string) => setAddress((current) => ({ ...current, [field]: value }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cart.length) return
    if (!/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setError('')
    const order = placeOrder(address)
    navigate(`/tracking?id=${encodeURIComponent(order.id)}`)
  }

  if (!cart.length) return <div className="container"><div className="empty-state flow-empty"><h2>Your bag is empty.</h2><p>Add a few everyday essentials before you check out.</p><Link className="button button-primary" to="/categories">Browse categories</Link></div></div>

  return <div className="flow-page container">
    <Link className="back-link" to="/cart"><ArrowLeft size={15} /> Back to your bag</Link>
    <div className="flow-heading"><span className="section-kicker">SECURE DEMO CHECKOUT</span><h1>Delivery details</h1><p>Tell us where to bring your essentials.</p></div>
    <div className="cart-layout checkout-layout">
      <form className="flow-form" onSubmit={submit}>
        <h2>Delivery address</h2>
        <div className="form-grid">
          <label>Full name<input required autoComplete="name" value={address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} /></label>
          <label>Phone number<input required inputMode="tel" autoComplete="tel" maxLength={14} placeholder="10-digit mobile number" value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} /></label>
          <label className="field-span">Street address<input required autoComplete="street-address" value={address.line1} onChange={(event) => updateAddress('line1', event.target.value)} /></label>
          <label>City<input required autoComplete="address-level2" value={address.city} onChange={(event) => updateAddress('city', event.target.value)} /></label>
          <label>PIN code<input required inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="\d{6}" value={address.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="payment-note"><ShieldCheck size={18} /><span><strong>Payment is not collected in this demo.</strong><small>Your order is saved locally in this browser.</small></span></div>
        <button className="button button-primary" type="submit">Place demo order <ArrowRight size={16} /></button>
      </form>
      <aside className="flow-summary"><span className="section-kicker">ORDER SUMMARY</span><h2>Your essentials.</h2>{cart.map((line) => {
        const product = getService(line.serviceId)
        return product ? <div className="summary-row" key={line.serviceId}><span>{product.name} × {line.quantity}</span><strong>₹{(product.price * line.quantity).toLocaleString('en-IN')}</strong></div> : null
      })}<div className="summary-total"><span>Total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><p className="summary-note">This demo does not connect to a payment provider.</p></aside>
    </div>
  </div>
}
