import { useState } from 'react'
import { ArrowDown, ArrowRight, MapPin, Menu, ShoppingBag, UserRound, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'About', href: '/#about' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [location, setLocation] = useState('Jaipur')
  const locations = ['Jaipur', 'Delhi', 'Mumbai', 'Bengaluru']
  const { cart, customer } = useCommerce()
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0)

  function chooseLocation(nextLocation: string) {
    setLocation(nextLocation)
    setLocationOpen(false)
  }

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
          <button className="mobile-location" type="button" aria-expanded={locationOpen} aria-controls="mobile-location-options" onClick={() => setLocationOpen(!locationOpen)}><MapPin size={15} /> {location} <ArrowDown size={13} /></button>
          {locationOpen && <div className="mobile-location-options" id="mobile-location-options">{locations.map((item) => <button key={item} type="button" aria-current={item === location ? 'true' : undefined} onClick={() => chooseLocation(item)}>{item}{item === location && <span>Selected</span>}</button>)}</div>}
        </div>
        <div className="nav-actions">
          <button className="location-button" type="button" aria-label={`Current location: ${location}`} aria-expanded={locationOpen} aria-controls="desktop-location-options" onClick={() => setLocationOpen(!locationOpen)}><MapPin size={17} /><span><small>YOUR LOCATION</small>{location}</span><ArrowDown size={13} /></button>
          {locationOpen && <div className="desktop-location-options" id="desktop-location-options">{locations.map((item) => <button key={item} type="button" aria-current={item === location ? 'true' : undefined} onClick={() => chooseLocation(item)}>{item}{item === location && <span>Selected</span>}</button>)}</div>}
          <Link className="cart-nav" to="/cart" aria-label={`Shopping cart, ${cartCount} items`}><ShoppingBag size={18} />{cartCount > 0 && <span>{cartCount}</span>}</Link>
          <Link className="login-link" to={customer ? '/profile' : '/login'}>{customer ? <><UserRound size={15} /> Profile</> : 'Log in'}</Link>
          <Link className="button button-primary nav-cta" to={customer ? '/categories' : '/register'}>{customer ? 'Explore SAU' : 'Get started'} <ArrowRight size={16} /></Link>
        </div>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </nav>
    </header>
  )
}
