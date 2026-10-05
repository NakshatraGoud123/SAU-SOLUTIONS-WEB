import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, LocateFixed, MapPin, ShieldCheck, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../context/usePreferences'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'
const REGISTRATION_KEY = 'sau-partner-registration-v1'

interface PartnerApplication {
  name: string
  email: string
  phone: string
  partnerType: string
  services: string
  experience: string
  address: string
  city: string
  area: string
  pincode: string
  location: string
  latitude?: number
  longitude?: number
  profilePhoto: string
  availability: string
}

function readApplication(): PartnerApplication | null {
  try {
    const raw = localStorage.getItem(REGISTRATION_KEY)
    return raw ? JSON.parse(raw) as PartnerApplication : null
  } catch (error) {
    console.error('Could not read the saved SAU partner registration.', error)
    return null
  }
}

export default function PartnerRegistration() {
  const { location, locationStatus, locationError, detectLocation } = usePreferences()
  const [application, setApplication] = useState<PartnerApplication | null>(readApplication)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [confirmedLocation, setConfirmedLocation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const locationConfirmationKey = location ? [location.label, location.latitude, location.longitude].join('|') : ''
  const locationConfirmed = Boolean(location && confirmedLocation === locationConfirmationKey)

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const nextPhoto = event.target.files?.[0] ?? null
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(nextPhoto)
    setPhotoPreview(nextPhoto ? URL.createObjectURL(nextPhoto) : '')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!location || !locationConfirmed) {
      setError('Detect or search for your location, review it, and confirm before submitting.')
      return
    }
    const data = new FormData(event.currentTarget)
    const phoneDigits = String(data.get('phone') ?? '').replace(/\D/g, '')
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      setError('Enter a valid phone number with 8 to 15 digits.')
      return
    }
    const photoFile = photo
    if (photoFile && photoFile.size > 2 * 1024 * 1024) {
      setError('Choose a profile photo under 2 MB.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const profilePhoto = photoFile ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the selected profile photo.'))
        reader.onerror = () => reject(new Error('Could not read the selected profile photo.'))
        reader.readAsDataURL(photoFile)
      }) : ''
      const nextApplication: PartnerApplication = {
        name: String(data.get('name') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        phone: String(data.get('phone') ?? '').trim(),
        partnerType: String(data.get('partnerType') ?? ''),
        services: String(data.get('services') ?? '').trim(),
        experience: String(data.get('experience') ?? '').trim(),
        address: String(data.get('address') ?? '').trim(),
        city: String(data.get('city') ?? '').trim(),
        area: String(data.get('area') ?? '').trim(),
        pincode: String(data.get('pincode') ?? '').trim(),
        location: location.label,
        latitude: location.latitude,
        longitude: location.longitude,
        profilePhoto,
        availability: String(data.get('availability') ?? ''),
      }
      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(nextApplication))
      setApplication(nextApplication)
    } catch (cause) {
      console.error('Could not save the SAU partner registration.', cause)
      setError(cause instanceof Error ? cause.message : 'Could not save your application on this device. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (application) {
    return <section className="partner-confirmation container">
      <span className="partner-success-icon"><CheckCircle2 size={28} /></span>
      <span className="section-kicker">APPLICATION SAVED</span>
      <h1>Thanks for choosing SAU, {application.name.split(' ')[0]}.</h1>
      <p>Your partner registration has been saved on this device. Our partner team can be reached at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
      <div className="partner-confirmation-card"><span><strong>{application.partnerType}</strong><small>Partner type</small></span><span><strong>{application.services}</strong><small>Services offered</small></span><span><strong>{application.location}</strong><small>Confirmed service location</small></span></div>
      <div className="partner-confirmation-actions"><Link className="button button-primary" to="/profile">Go to your profile <ArrowRight size={16} /></Link><Link className="text-link" to="/">Return home</Link></div>
      <p className="partner-local-note"><ShieldCheck size={15} /> This demo stores your application in this browser only; no application was sent to a server.</p>
    </section>
  }

  const mapUrl = location?.latitude !== undefined && location.longitude !== undefined
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.008}%2C${location.latitude - 0.006}%2C${location.longitude + 0.008}%2C${location.latitude + 0.006}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`
    : ''

  return <section className="partner-page container">
    <header className="partner-page-heading">
      <span className="section-kicker">BUILD YOUR BUSINESS WITH SAU</span>
      <h1>Good work deserves<br /><span>to find more people.</span></h1>
      <p>Introduce your skills to customers nearby. Tell us about your work and where you serve.</p>
      <a className="partner-support-link" href={`mailto:${SUPPORT_EMAIL}`}>Partner support: {SUPPORT_EMAIL}</a>
    </header>
    <form className="partner-form" onSubmit={submit}>
      <div className="partner-form-section">
        <div className="partner-form-title"><span>01</span><div><h2>Your details</h2><p>How customers and our team can reach you.</p></div></div>
        <div className="partner-fields">
          <label>Name<input name="name" required autoComplete="name" /></label>
          <label>Email<input name="email" required type="email" autoComplete="email" /></label>
          <label>Phone<input name="phone" required type="tel" inputMode="tel" minLength={8} maxLength={18} autoComplete="tel" /></label>
          <label>Partner type<select name="partnerType" required defaultValue=""><option value="" disabled>Select partner type</option><option>Independent professional</option><option>Local business</option><option>Service team</option></select></label>
          <label className="partner-field-wide">Services offered<textarea name="services" required rows={3} placeholder="What services or products do you offer?" /></label>
          <label>Experience<select name="experience" required defaultValue=""><option value="" disabled>Select experience</option><option>Just getting started</option><option>1–2 years</option><option>3–5 years</option><option>6–10 years</option><option>10+ years</option></select></label>
          <label>Availability<select name="availability" required defaultValue=""><option value="" disabled>Select availability</option><option>Weekdays</option><option>Weekends</option><option>All week</option><option>Flexible / by appointment</option></select></label>
          <label className="partner-field-wide">Profile photo <span className="partner-photo-input"><Upload size={17} /><span>{photo?.name ?? 'Choose a clear profile or business photo (up to 2 MB)'}</span><input type="file" accept="image/*" onChange={choosePhoto} /></span></label>
          {photoPreview && <img className="partner-photo-preview" src={photoPreview} alt="Selected partner profile" />}
        </div>
      </div>

      <div className="partner-form-section">
        <div className="partner-form-title"><span>02</span><div><h2>Where you work</h2><p>Your service area helps us connect you with nearby customers.</p></div></div>
        <div className="partner-fields">
          <label className="partner-field-wide">Address<input name="address" required autoComplete="street-address" /></label>
          <label>City<input name="city" required autoComplete="address-level2" defaultValue={location?.city ?? ''} /></label>
          <label>Area<input name="area" required defaultValue={location?.area ?? ''} /></label>
          <label>Pincode<input name="pincode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" /></label>
        </div>
        <div className="partner-location-box">
          <div className="partner-location-heading"><span className="partner-location-icon"><MapPin size={18} /></span><div><strong>Confirm your current location</strong><small>Used to show your business area on the map.</small></div></div>
          {location && <p className="partner-location-value">{location.label}</p>}
          {mapUrl && <iframe className="partner-map" title={`Map preview for ${location?.label ?? 'your location'}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer" />}
          {location?.latitude !== undefined && <a className="partner-map-link" href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`} target="_blank" rel="noreferrer">Open map to verify pin</a>}
          {mapUrl && <small className="partner-map-attribution">Map data © OpenStreetMap contributors</small>}
          <button className="button button-outline partner-location-button" type="button" onClick={() => { setConfirmedLocation(''); void detectLocation() }} disabled={locationStatus === 'detecting'}><LocateFixed size={16} />{locationStatus === 'detecting' ? 'Detecting location...' : 'Use My Current Location'}</button>
          {locationError && <p className="partner-form-error" role="alert">{locationError}</p>}
          {location && <label className="partner-location-confirm"><input type="checkbox" checked={confirmedLocation === locationConfirmationKey} onChange={(event) => setConfirmedLocation(event.target.checked ? locationConfirmationKey : '')} /> I confirm this is the area where I’m available to serve.</label>}
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary partner-submit" type="submit" disabled={saving || !location || !locationConfirmed}>{saving ? 'Saving your registration…' : <>Submit partner registration <ArrowRight size={16} /></>}</button>
      <p className="partner-privacy-note">Your details stay in this browser in this demo. Need help? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </form>
  </section>
}
