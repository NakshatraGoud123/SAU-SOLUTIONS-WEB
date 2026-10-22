import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { getCartTotal, type Address } from '../data/commerce'
import { useCatalog } from '../context/useCatalog'
import { usePreferences } from '../context/usePreferences'
import { fetchAddresses, saveAddress } from '../services/addressService'
import type { Address as SavedAddress } from '../types'

const emptyAddress: Address = { fullName: '', phone: '', line1: '', city: '', postalCode: '' }

export default function Checkout() {
  const { cart, placeOrder, customer } = useCommerce()
  const { services } = useCatalog()
  const { location } = usePreferences()
  const navigate = useNavigate()
  const [address, setAddress] = useState<Address>({ ...emptyAddress, fullName: customer?.name ?? '', city: location?.city ?? '' })
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const total = getCartTotal(cart, (id) => services.find((service) => service.id === id))

  useEffect(() => {
    if (!customer) return
    let active = true
    void fetchAddresses(customer.id).then((items) => {
      if (!active) return
      setSavedAddresses(items)
      const preferred = items.find((item) => item.is_default)
      if (preferred?.id) {
        setSelectedAddressId(preferred.id)
        setAddress({
          fullName: preferred.full_name,
          phone: preferred.phone,
          line1: preferred.address_line,
          city: preferred.city,
          postalCode: preferred.postal_code,
        })
      }
    }).catch((cause: unknown) => {
      console.error('Could not load saved addresses for checkout.', cause)
      if (active) setError('Unable to load your saved addresses. You can enter a new address.')
    })
    return () => { active = false }
  }, [customer])

  function updateAddress(field: keyof Address, value: string) {
    setSelectedAddressId('')
    setAddress((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cart.length) return
    if (!customer) {
      navigate('/login')
      return
    }
    if (!/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setError('')
    setSaving(true)
    try {
      let addressId = selectedAddressId
      if (!addressId) {
        const addressDetails = {
          full_name: address.fullName.trim(),
          phone: address.phone.trim(),
          address_line: address.line1.trim(),
          city: address.city || location?.city || '',
          postal_code: address.postalCode.trim(),
        }
        const matchingAddress = savedAddresses.find((item) =>
          item.full_name === addressDetails.full_name
          && item.phone === addressDetails.phone
          && item.address_line === addressDetails.address_line
          && item.city === addressDetails.city
          && item.postal_code === addressDetails.postal_code,
        )
        if (matchingAddress?.id) {
          addressId = matchingAddress.id
          setSelectedAddressId(matchingAddress.id)
        } else {
          const saved = await saveAddress(customer.id, addressDetails)
          if (!saved.id) throw new Error('The saved address did not include an ID.')
          addressId = saved.id
          setSelectedAddressId(saved.id)
          setSavedAddresses((current) => [...current, saved])
        }
      }
      const orderId = await placeOrder(addressId)
      navigate(`/tracking?id=${encodeURIComponent(orderId)}`)
    } catch (cause) {
      console.error('Could not place the marketplace order.', cause)
      setError('Unable to place your order. Please review the address and cart, then try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!cart.length) return <div className="container"><div className="empty-state flow-empty"><h2>Your bag is empty.</h2><p>Add a few everyday essentials before you check out.</p><Link className="button button-primary" to="/categories">Browse categories</Link></div></div>

  return <div className="flow-page container">
    <Link className="back-link" to="/cart"><ArrowLeft size={15} /> Back to your bag</Link>
    <div className="flow-heading"><span className="section-kicker">PRE-LAUNCH ORDER REQUEST</span><h1>Delivery details</h1><p>Review the order request flow. Submitting does not confirm product availability or delivery.</p></div>
    <div className="cart-layout checkout-layout">
      <form className="flow-form" onSubmit={(event) => void submit(event)}>
        <h2>Delivery address</h2>
        {savedAddresses.length > 0 && <label>Saved address<select value={selectedAddressId} onChange={(event) => {
          const nextId = event.target.value
          setSelectedAddressId(nextId)
          const selected = savedAddresses.find((item) => item.id === nextId)
          if (selected) setAddress({ fullName: selected.full_name, phone: selected.phone, line1: selected.address_line, city: selected.city, postalCode: selected.postal_code })
        }}><option value="">Enter a new address</option>{savedAddresses.filter((item) => item.id).map((item) => <option key={item.id} value={item.id}>{item.address_line}, {item.city}{item.is_default ? ' (Default)' : ''}</option>)}</select></label>}
        <div className="form-grid">
          <label>Full name<input required autoComplete="name" value={address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} /></label>
          <label>Phone number<input required inputMode="tel" autoComplete="tel" maxLength={14} placeholder="10-digit mobile number" value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} /></label>
          <label className="field-span">Street address<input required autoComplete="street-address" value={address.line1} onChange={(event) => updateAddress('line1', event.target.value)} /></label>
          <label>City<input required autoComplete="address-level2" value={address.city || location?.city || ''} onChange={(event) => updateAddress('city', event.target.value)} /></label>
          <label>PIN code<input required inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="\d{6}" value={address.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="payment-note"><ShieldCheck size={18} /><span><strong>Pre-launch order request</strong><small>Submitting may save an order request; it does not confirm fulfillment.</small></span></div>
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Submitting request…' : 'Submit order request'} <ArrowRight size={16} /></button>
      </form>
      <aside className="flow-summary"><span className="section-kicker">ORDER SUMMARY</span><h2>Your essentials.</h2>{cart.map((line) => {
        const product = services.find((service) => service.id === line.serviceId && service.kind === 'product')
        return product ? <div className="summary-row" key={line.serviceId}><span>{product.name} × {line.quantity}</span><strong>₹{(product.price * line.quantity).toLocaleString('en-IN')}</strong></div> : null
      })}<div className="summary-total"><span>Total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><p className="summary-note">No payment is collected on this website.</p></aside>
    </div>
  </div>
}
