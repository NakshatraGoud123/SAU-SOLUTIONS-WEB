import { useState, type FormEvent } from 'react'
import { ArrowRight, ArrowUpRight, Check, MapPin, Search, ShieldCheck, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import IconGlyph from './IconGlyph'
import PhotoImage from './PhotoImage'
import { heroPhoto } from '../data/imageCatalog'

const suggestions = ['Home cleaning', 'Electrician', 'Fresh groceries', 'Beauty at home']

export default function Hero() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/categories?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <section className="hero-section">
      <div className="hero-grid container">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> A little more ease, every day</div>
          <h1>Your everyday life,<br />made <span>remarkably</span> easier.</h1>
          <p className="hero-subtitle">Discover trusted services, everyday essentials and professionals — all from one platform.</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <label className="search-location">
              <MapPin size={19} />
              <span className="sr-only">Your location</span>
              <input aria-label="Your location" defaultValue="Jaipur" />
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
          <div className="hero-proof"><div className="avatar-stack"><span>A</span><span>R</span><span>M</span><span>+</span></div><div><strong>Loved by your neighbourhood</strong><small><Star size={12} fill="currentColor" /> 4.9 average experience</small></div></div>
        </motion.div>

        <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }}>
          <div className="visual-backdrop">
            <div className="hero-service-tile tile-home"><span className="tile-icon tone-violet"><IconGlyph name="house" size={24} /></span><div><strong>Home, sorted.</strong><small>Trusted help, right on time</small></div><Check size={17} /></div>
            <div className="hero-service-tile tile-grocery"><span className="tile-icon tone-green"><IconGlyph name="shopping-basket" size={23} /></span><div><strong>Daily essentials</strong><small>At your door in 25 min</small></div><span className="tile-status">On the way</span></div>
            <div className="visual-center-card">
              <div className="visual-card-top"><span className="mini-brand">s<span>.</span></span><span className="live-status"><i /> AVAILABLE NOW</span></div>
              <PhotoImage className="visual-illustration" photo={heroPhoto} label="Everyday family life" loading="eager" fetchPriority="high" />
              <div className="visual-card-caption"><span>Life's little to-do list</span><strong>Consider it handled.</strong></div>
              <div className="visual-card-footer"><span><ShieldCheck size={15} /> Verified & trusted</span><Link to="/categories" aria-label="Explore services"><ArrowUpRight size={18} /></Link></div>
            </div>
            <div className="floating-note note-rating"><span><Star size={13} fill="currentColor" /></span><div><strong>4.9/5</strong><small>Local favourites</small></div></div>
            <div className="floating-note note-pro"><span><ShieldCheck size={20} /></span><div><strong>Every pro</strong><small>carefully verified</small></div></div>
            <div className="visual-caption"><span /> ONE APP. A WHOLE LOT LESS TO DO <ArrowUpRight size={13} /></div>
          </div>
        </motion.div>
      </div>
      <div className="hero-bottom-glow" />
    </section>
  )
}
