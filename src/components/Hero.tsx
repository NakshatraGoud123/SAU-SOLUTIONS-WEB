import { useState, type FormEvent } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import IconGlyph from './IconGlyph'
import PhotoImage from './PhotoImage'
import { heroPhoto } from '../data/imageCatalog'
import { usePreferences } from '../context/usePreferences'

const suggestions = ['Home services', 'Mechanic services', 'Food & beverages', 'Tech services']

export default function Hero() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { location, locationStatus } = usePreferences()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/categories?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <section className="hero-section">
      <div className="hero-grid container">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> A little more ease, every day</div>
          <h1>SAU Solutions — All Services in One App</h1>
          <p className="hero-subtitle">Discover everyday services, essential products, and trusted professionals through one convenient platform.</p>

          <div className="hero-cta-row">
            <Link className="button button-primary" to="/categories">Explore SAU Services <ArrowRight size={16} /></Link>
            <Link className="button button-secondary" to="/partner/register">Become a Partner</Link>
          </div>

          <form className="hero-search" onSubmit={submitSearch}>
            <label className="search-location">
              <MapPin size={19} />
              <span className="sr-only">Your location</span>
              <input aria-label="Your location" readOnly value={location?.label ?? (locationStatus === 'detecting' ? 'Detecting location...' : 'Set location')} />
            </label>
            <span className="search-divider" />
            <label className="search-query">
              <Search size={19} />
              <span className="sr-only">What do you need?</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What do you need today?" />
            </label>
            <button className="search-submit" type="submit" aria-label="Search services"><ArrowRight size={20} /></button>
          </form>
          <div className="popular-searches"><span>Popular:</span>
            {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => navigate(`/categories?q=${encodeURIComponent(suggestion)}`)}>{suggestion}</button>)}
          </div>
          <div className="hero-proof"><MapPin size={17} /><span>Designed for local discovery in Hyderabad</span></div>
        </motion.div>

        <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }}>
          <div className="visual-backdrop">
            <div className="hero-service-tile tile-home"><span className="tile-icon tone-violet"><IconGlyph name="house" size={24} /></span><div><strong>Home services</strong><small>Explore published listings</small></div></div>
            <div className="hero-service-tile tile-grocery"><span className="tile-icon tone-green"><IconGlyph name="shopping-basket" size={23} /></span><div><strong>Everyday products</strong><small>Browse the current catalog</small></div></div>
            <div className="visual-center-card">
              <div className="visual-card-top"><span className="mini-brand">s<span>.</span></span><span className="visual-brand-label">SAU SERVICES</span></div>
              <PhotoImage className="visual-illustration" photo={heroPhoto} label="Everyday family life" loading="eager" fetchPriority="high" />
              <div className="visual-card-caption"><span>Everyday needs, together</span><strong>Explore what’s listed.</strong></div>
              <div className="visual-card-footer"><span>Services & products</span><Link to="/categories" aria-label="Explore services"><ArrowUpRight size={18} /></Link></div>
            </div>
            <div className="floating-note note-catalog"><span><MapPin size={15} /></span><div><strong>Local discovery</strong><small>Explore by category</small></div></div>
            <div className="floating-note note-search"><span><Search size={18} /></span><div><strong>Browse listings</strong><small>Availability may vary</small></div></div>
            <div className="visual-caption"><span /> ALL SERVICES IN ONE APP <ArrowUpRight size={13} /></div>
          </div>
        </motion.div>
      </div>
      <div className="hero-bottom-glow" />
    </section>
  )
}
