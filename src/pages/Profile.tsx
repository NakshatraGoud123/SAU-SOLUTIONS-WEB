import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Bell, LogOut, MapPin, Pencil, Trash2, UserRound } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import type { Address, UserProfile } from '../types'
import { fetchProfile, updateProfile } from '../services/profileService'
import { deleteAddress, fetchAddresses, saveAddress } from '../services/addressService'
import { markNotificationRead } from '../services/notificationService'
import { requireSupabaseClient } from '../lib/supabase'

const newAddress = (): Address => ({
  full_name: '',
  phone: '',
  address_line: '',
  city: '',
  postal_code: '',
  is_default: false,
})

export default function Profile() {
  const { customer, signOut, orders, bookings, notifications, isLoading, refreshActivity } = useCommerce()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressDraft, setAddressDraft] = useState<Address>(newAddress())
  const [editingAddressId, setEditingAddressId] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!customer) return
    let active = true
    void Promise.all([fetchProfile(customer.id), fetchAddresses(customer.id)]).then(([nextProfile, nextAddresses]) => {
      if (!active) return
      setProfile(nextProfile)
      setAddresses(nextAddresses)
      setName(nextProfile?.full_name ?? '')
      setPhone(nextProfile?.phone ?? '')
    }).catch((cause: unknown) => {
      console.error('Could not load profile settings.', cause)
      if (active) setError('Unable to load profile details. Please try again.')
    })
    return () => { active = false }
  }, [customer])

  if (isLoading) return <div className="flow-page container"><p role="status">Loading your profile…</p></div>
  if (!customer) return <Navigate to="/login" replace />
  const activeCustomer = customer

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (photo) {
        if (photo.size > 2 * 1024 * 1024) throw new Error('Choose a profile photo under 2 MB.')
        if (!photo.type.startsWith('image/')) throw new Error('Choose an image file.')
        const extension = photo.name.split('.').at(-1)?.toLowerCase() || 'jpg'
        const path = `${activeCustomer.id}/profile.${extension}`
        const client = requireSupabaseClient()
        const { error: uploadError } = await client.storage.from('partner-avatars').upload(path, photo, { upsert: true, contentType: photo.type })
        if (uploadError) throw new Error(uploadError.message)
        avatarUrl = client.storage.from('partner-avatars').getPublicUrl(path).data.publicUrl
      }
      const nextProfile = await updateProfile(activeCustomer.id, { full_name: name.trim(), phone: phone.trim() || null, avatar_url: avatarUrl })
      setProfile(nextProfile)
      setMessage('Your profile has been updated.')
    } catch (cause) {
      console.error('Could not update your profile.', cause)
      setError('Unable to update your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await saveAddress(activeCustomer.id, {
        ...addressDraft,
        is_default: addressDraft.is_default || addresses.length === 0,
      })
      setAddresses((current) => [saved, ...current.filter((item) => item.id !== saved.id).map((item) => ({
        ...item,
        is_default: saved.is_default ? false : item.is_default,
      }))])
      setAddressDraft(newAddress())
      setEditingAddressId(undefined)
      setMessage('Your address has been saved.')
    } catch (cause) {
      console.error('Could not save the address.', cause)
      setError('Unable to save this address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function removeAddress(addressId: string) {
    setError('')
    try {
      await deleteAddress(activeCustomer.id, addressId)
      setAddresses((current) => current.filter((item) => item.id !== addressId))
    } catch (cause) {
      console.error('Could not delete the address.', cause)
      setError('Unable to delete this address. Please try again.')
    }
  }

  async function readNotification(notificationId: string) {
    try {
      await markNotificationRead(activeCustomer.id, notificationId)
      await refreshActivity()
    } catch (cause) {
      console.error('Could not mark the notification as read.', cause)
      setError('Unable to update notifications. Please try again.')
    }
  }

  async function handleSignOut() {
    setError('')
    try {
      await signOut()
    } catch (cause) {
      console.error('Could not sign out.', cause)
      setError('Unable to sign out. Please try again.')
    }
  }

  return <div className="flow-page container">
    <div className="flow-heading"><span className="section-kicker">YOUR SAU PROFILE</span><h1>A little more personal.</h1><p>Manage your profile, saved addresses and account activity.</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="form-success" role="status">{message}</p>}
    <section className="profile-card"><span className="profile-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <UserRound size={28} />}</span><div className="profile-data"><span className="activity-kind">{customer.role === 'partner' ? 'SAU PARTNER PROFILE' : 'SAU MEMBER'}</span><strong>{customer.name}</strong><span>{customer.email}</span></div><button className="button button-outline" type="button" onClick={() => void handleSignOut()}><LogOut size={15} /> Sign out</button></section>

    <form className="flow-form profile-settings-form" onSubmit={(event) => void saveProfile(event)}>
      <h2>Profile details</h2>
      <div className="form-grid">
        <label>Full name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Email address<input value={customer.email} readOnly /></label>
        <label>Phone number<input inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label>Profile photo<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /></label>
      </div>
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
    </form>

    <section className="flow-form">
      <h2>Saved addresses</h2>
      {addresses.map((address) => <article className="activity-card" key={address.id}><span className="activity-icon tone-green"><MapPin size={20} /></span><div className="activity-info"><strong>{address.full_name}{address.is_default ? ' · Default' : ''}</strong><span>{address.address_line}, {address.city} {address.postal_code}</span><span>{address.phone}</span></div><button className="icon-button" type="button" aria-label={`Edit ${address.full_name}'s address`} onClick={() => { setAddressDraft(address); setEditingAddressId(address.id) }}><Pencil size={15} /></button><button className="icon-button" type="button" aria-label={`Delete ${address.full_name}'s address`} onClick={() => address.id && void removeAddress(address.id)}><Trash2 size={15} /></button></article>)}
      <form onSubmit={(event) => void submitAddress(event)}>
        <h3>{editingAddressId ? 'Edit address' : 'Add an address'}</h3>
        <div className="form-grid">
          <label>Full name<input required value={addressDraft.full_name} onChange={(event) => setAddressDraft((current) => ({ ...current, full_name: event.target.value }))} /></label>
          <label>Phone<input required value={addressDraft.phone} onChange={(event) => setAddressDraft((current) => ({ ...current, phone: event.target.value }))} /></label>
          <label className="field-span">Street address<input required value={addressDraft.address_line} onChange={(event) => setAddressDraft((current) => ({ ...current, address_line: event.target.value }))} /></label>
          <label>City<input required value={addressDraft.city} onChange={(event) => setAddressDraft((current) => ({ ...current, city: event.target.value }))} /></label>
          <label>Postal code<input required value={addressDraft.postal_code} onChange={(event) => setAddressDraft((current) => ({ ...current, postal_code: event.target.value }))} /></label>
          <label className="field-span"><input type="checkbox" checked={addressDraft.is_default ?? false} onChange={(event) => setAddressDraft((current) => ({ ...current, is_default: event.target.checked }))} /> Set as default</label>
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingAddressId ? 'Update address' : 'Add address'} <ArrowRight size={15} /></button>
        {editingAddressId && <button className="button button-outline" type="button" onClick={() => { setAddressDraft(newAddress()); setEditingAddressId(undefined) }}>Cancel</button>}
      </form>
    </section>

    <section className="flow-form">
      <h2><Bell size={18} /> Notifications</h2>
      {notifications.length === 0 ? <p>No notifications yet.</p> : notifications.map((notification) => <article className="activity-card" key={notification.id}><div className="activity-info"><span className="activity-kind">{notification.is_read ? 'READ' : 'NEW'} · {notification.type}</span><strong>{notification.title}</strong><span>{notification.message}</span><small>{new Date(notification.created_at).toLocaleString()}</small></div>{!notification.is_read && <button className="button button-outline" type="button" onClick={() => void readNotification(notification.id)}>Mark read</button>}</article>)}
    </section>

    <div className="profile-shortcuts"><Link to="/orders"><span><strong>{orders.length}</strong><small>Orders</small></span><span>View your order history <ArrowRight size={15} /></span></Link><Link to="/orders"><span><strong>{bookings.length}</strong><small>Bookings</small></span><span>View your bookings <ArrowRight size={15} /></span></Link></div>
  </div>
}
