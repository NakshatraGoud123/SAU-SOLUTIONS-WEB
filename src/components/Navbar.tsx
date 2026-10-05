import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, LocateFixed, MapPin, Menu, Moon, Search, ShoppingBag, Sun, UserRound, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { usePreferences } from '../context/usePreferences'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'About', href: '/#about' },
  { label: 'SAU Partner', href: '/partner/register' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { theme, toggleTheme, location, locationStatus, locationError, detectLocation, searchLocation } = usePreferences()
  const { cart, customer } = useCommerce()
  const requestedLocation = useRef(false)
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0)

  useEffect(() => {
    if (!location && !requestedLocation.current) {
      requestedLocation.current = true
      void detectLocation()
    }
  }, [location, detectLocation])

  function submitLocationSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void searchLocation(searchValue)
    setLocationOpen(false)
  }

  const locationLabel = location?.label ?? (locationStatus === 'detecting' ? 'Detecting location...' : 'Set your location')

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main navigation">
        <Link className="wordmark" to="/" onClick={() => setMenuOpen(false)} aria-label="SAU Solutions home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">SAU<span>SOLUTIONS</span><small>ALL SERVICES IN ONE APP</small></span>
        </Link>
        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {links.map((link) => link.href.startsWith('/#')
            ? <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
            : <NavLink key={link.label} to={link.href} onClick={() => setMenuOpen(false)}>{link.label}</NavLink>)}
          <button className="mobile-location" type="button" aria-expanded={locationOpen} aria-controls="location-popover" onClick={() => setLocationOpen(!locationOpen)}><MapPin size={15} /> {locationLabel} <ArrowDown size={13} /></button>
        </div>
        <div className="nav-actions">
          <button className="location-button" type="button" aria-label={`Current location: ${locationLabel}`} aria-expanded={locationOpen} aria-controls="location-popover" onClick={() => setLocationOpen(!locationOpen)}><MapPin size={17} /><span><small>YOUR LOCATION</small>{locationLabel}</span><ArrowDown size={13} /></button>
          {locationOpen && <div className="location-popover" id="location-popover">
            <span className="location-popover-title">Set your service area</span>
            <form onSubmit={submitLocationSearch} className="location-search-form"><Search size={16} /><input aria-label="Search location" placeholder="Search area or city" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} /><button type="submit" disabled={locationStatus === 'detecting'}>Search</button></form>
            <button className="location-gps-button" type="button" onClick={() => { void detectLocation() }} disabled={locationStatus === 'detecting'}><LocateFixed size={16} />{locationStatus === 'detecting' ? 'Detecting location...' : 'Use My Current Location'}</button>
            {locationError && <p role="alert" className="location-error">{locationError}</p>}
            {location && <p className="location-selected"><MapPin size={13} /> Serving {location.label}</p>}
            <small className="location-attribution">Location lookup by OpenStreetMap.</small>
            <small className="location-privacy-note">Search terms or GPS coordinates are sent to OpenStreetMap to find an area. Your selection is saved only in this browser.</small>
          </div>}
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
          <Link className="cart-nav" to="/cart" aria-label={`Shopping cart, ${cartCount} items`}><ShoppingBag size={18} />{cartCount > 0 && <span>{cartCount}</span>}</Link>
          <Link className="login-link" to={customer ? '/profile' : '/login'}>{customer ? <><UserRound size={15} /> Profile</> : 'Log in'}</Link>
          <Link className="button button-primary nav-cta" to={customer ? '/categories' : '/register'}>{customer ? 'Explore SAU' : 'Get started'} <ArrowRight size={16} /></Link>
        </div>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </nav>
    </header>
  )
}
