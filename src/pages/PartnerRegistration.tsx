import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, LocateFixed, MapPin, ShieldCheck, Upload } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { usePreferences } from '../context/usePreferences'
import { useCommerce } from '../context/useCommerce'
import {
  fetchOwnPartnerProfile,
  fetchPartnerBookings,
  savePartnerProfile,
  updatePartnerBookingStatus,
  type PartnerBookingStatus,
  type PartnerJob,
} from '../services/partnerService'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'
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

const nextPartnerStatuses: Partial<Record<PartnerJob['status'], PartnerBookingStatus[]>> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['SERVICE_STARTED', 'CANCELLED'],
  SERVICE_STARTED: ['COMPLETED'],
}

function formatBookingStatus(status: PartnerJob['status']) {
  return status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function PartnerRegistration() {
  const { location, locationStatus, locationError, detectLocation } = usePreferences()
  const { customer, isLoading: authLoading } = useCommerce()
  const [application, setApplication] = useState<PartnerApplication | null>(null)
  const [loadedProfileUserId, setLoadedProfileUserId] = useState<string | null>(null)
  const [partnerJobs, setPartnerJobs] = useState<PartnerJob[]>([])
  const [loadedJobsUserId, setLoadedJobsUserId] = useState<string | null>(null)
  const [jobsError, setJobsError] = useState('')
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [confirmedLocation, setConfirmedLocation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const locationConfirmationKey = location ? [location.label, location.latitude, location.longitude].join('|') : ''
  const locationConfirmed = Boolean(location && confirmedLocation === locationConfirmationKey)
  const profileLoading = customer?.role === 'partner' && loadedProfileUserId !== customer.id
  const jobsLoading = customer?.role === 'partner' && loadedJobsUserId !== customer.id

  useEffect(() => {
    if (authLoading || !customer || customer.role !== 'partner') return
    let active = true
    void fetchOwnPartnerProfile(customer.id).then((profile) => {
      if (!active || !profile) return
      setApplication({
        name: profile.business_name,
        email: customer.email,
        phone: profile.phone ?? '',
        partnerType: profile.partner_type ?? 'Partner',
        services: profile.services_offered ?? '',
        experience: profile.experience ?? '',
        address: profile.address ?? '',
        city: profile.service_area ?? '',
        area: '',
        pincode: profile.postal_code ?? '',
        location: profile.service_area ?? '',
        latitude: profile.latitude ?? undefined,
        longitude: profile.longitude ?? undefined,
        profilePhoto: profile.profile_image ?? '',
        availability: profile.availability ?? '',
      })
    }).catch((cause: unknown) => {
      console.error('Could not load the partner profile.', cause)
      if (active) setError('Unable to load your partner profile. Please try again.')
    }).finally(() => {
      if (active) setLoadedProfileUserId(customer.id)
    })
    return () => { active = false }
  }, [authLoading, customer])

  useEffect(() => {
    if (authLoading || !customer || customer.role !== 'partner') return
    let active = true
    void fetchPartnerBookings().then((jobs) => {
      if (active) setPartnerJobs(jobs)
    }).catch((cause: unknown) => {
      console.error('Could not load partner bookings.', cause)
      if (active) setJobsError('Unable to load partner bookings. Please try again.')
    }).finally(() => {
      if (active) setLoadedJobsUserId(customer.id)
    })
    return () => { active = false }
  }, [authLoading, customer])

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
    if (!location || location.latitude === undefined || location.longitude === undefined || !locationConfirmed) {
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
        profilePhoto: '',
        availability: String(data.get('availability') ?? ''),
      }
      if (!customer) throw new Error('Sign in with your partner account before saving this profile.')
      await savePartnerProfile(customer.id, {
        businessName: nextApplication.name,
        partnerType: nextApplication.partnerType,
        servicesOffered: nextApplication.services,
        experience: nextApplication.experience,
        address: nextApplication.address,
        postalCode: nextApplication.pincode,
        phone: nextApplication.phone,
        serviceArea: [nextApplication.area, nextApplication.city].filter(Boolean).join(', '),
        latitude: location.latitude,
        longitude: location.longitude,
        availability: nextApplication.availability,
        photo: photoFile,
      })
      setApplication(nextApplication)
    } catch (cause) {
      console.error('Could not save the SAU partner registration.', cause)
      setError('Unable to save your partner profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function changeJobStatus(job: PartnerJob, status: PartnerBookingStatus) {
    setUpdatingJobId(job.id)
    setJobsError('')
    try {
      await updatePartnerBookingStatus(job.id, status)
      setPartnerJobs(await fetchPartnerBookings())
    } catch (cause) {
      console.error('Could not update the partner booking status.', cause)
      setJobsError('Unable to update this booking. It may have changed or been accepted by another partner.')
    } finally {
      setUpdatingJobId(null)
    }
  }

  if (authLoading || profileLoading) return <section className="container"><p role="status">Loading partner profile…</p></section>
  if (!customer) return <Navigate to="/register?type=partner" replace />
  if (customer.role !== 'partner') {
    return <section className="container empty-state"><h1>Partner account required</h1><p>Create a partner account before saving your business profile.</p><Link className="button button-primary" to="/register?type=partner">Create partner account</Link></section>
  }

  if (application) {
    return <section className="partner-confirmation container">
      <span className="partner-success-icon"><CheckCircle2 size={28} /></span>
      <span className="section-kicker">APPLICATION SAVED</span>
      <h1>Thanks for choosing SAU, {application.name.split(' ')[0]}.</h1>
      <p>Your partner profile is saved to your SAU account. Our partner team can be reached at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
      <div className="partner-confirmation-card"><span><strong>{application.partnerType}</strong><small>Partner type</small></span><span><strong>{application.services}</strong><small>Services offered</small></span><span><strong>{application.location}</strong><small>Confirmed service location</small></span></div>
      <div className="partner-confirmation-actions"><Link className="button button-primary" to="/profile">Go to your profile <ArrowRight size={16} /></Link><Link className="text-link" to="/">Return home</Link></div>
      <section className="partner-job-board flow-form" aria-labelledby="partner-jobs-heading">
        <h2 id="partner-jobs-heading">Partner bookings</h2>
        {jobsLoading && <p role="status">Loading partner bookings…</p>}
        {jobsError && <p className="form-error" role="alert">{jobsError}</p>}
        {!jobsLoading && !jobsError && partnerJobs.length === 0 && <p>No open or assigned bookings right now.</p>}
        {partnerJobs.map((job) => <article className="activity-card" key={job.id}>
          <div className="activity-card-heading">
            <div><strong>{job.service_name}</strong><small>{job.booking_date} at {job.booking_time}</small></div>
            <span className="activity-status">{formatBookingStatus(job.status)}</span>
          </div>
          {job.total_amount !== null && <p>₹{Number(job.total_amount).toLocaleString('en-IN')}</p>}
          <div className="partner-confirmation-actions">
            {(nextPartnerStatuses[job.status] ?? []).map((status) => <button
              className={status === 'REJECTED' || status === 'CANCELLED' ? 'button button-outline' : 'button button-primary'}
              type="button"
              key={status}
              disabled={updatingJobId === job.id}
              onClick={() => void changeJobStatus(job, status)}
            >{updatingJobId === job.id ? 'Updating…' : formatBookingStatus(status)}</button>)}
          </div>
        </article>)}
      </section>
      <p className="partner-local-note"><ShieldCheck size={15} /> Your profile is stored securely with your SAU partner account.</p>
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
          <label>Name<input name="name" required autoComplete="name" defaultValue={customer.name} /></label>
          <label>Email<input name="email" required type="email" autoComplete="email" defaultValue={customer.email} readOnly /></label>
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
      <button className="button button-primary partner-submit" type="submit" disabled={saving || !location || !locationConfirmed}>{saving ? 'Saving your profile…' : <>Save partner profile <ArrowRight size={16} /></>}</button>
      <p className="partner-privacy-note">Your profile is saved to Supabase and is only editable by your account. Need help? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </form>
  </section>
}
