import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, MapPin, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { usePreferences } from '../context/usePreferences'
import NeighborhoodExperience from './NeighborhoodExperience'
import type { NeighborhoodCopy } from './neighborhood-copy'

const copy: Record<'en' | 'hi', NeighborhoodCopy> = {
  en: {
    eyebrow: 'SAU SERVICES · PRE-LAUNCH',
    title: 'Your whole neighbourhood,',
    accent: 'in one app.',
    subtitle: 'A thoughtful preview of the local shops, skilled professionals and everyday services SAU SERVICES is being built to bring closer together.',
    explore: 'Explore categories', partner: 'Partner information', search: 'What do you need today?',
    location: 'Your location', searchButton: 'Search categories', preview: 'An illustrative neighbourhood preview · Listings and availability are not confirmed.',
    day: 'Day', night: 'Night', language: 'हिन्दी',
  },
  hi: {
    eyebrow: 'SAU SERVICES · जल्द आ रहा है',
    title: 'आपका पूरा मोहल्ला,',
    accent: 'एक ही ऐप में।',
    subtitle: 'स्थानीय दुकानों, कुशल पेशेवरों और रोज़मर्रा की सेवाओं की एक झलक, जिन्हें SAU SERVICES एक साथ लाने की तैयारी कर रहा है।',
    explore: 'श्रेणियाँ देखें', partner: 'पार्टनर जानकारी', search: 'आज आपको क्या चाहिए?',
    location: 'आपका स्थान', searchButton: 'श्रेणियाँ खोजें', preview: 'मोहल्ले का एक कल्पनात्मक दृश्य · लिस्टिंग और उपलब्धता की पुष्टि नहीं है।',
    day: 'दिन', night: 'रात', language: 'English',
  },
} as const

export default function Hero() {
  const [search, setSearch] = useState('')
  const [isNight, setIsNight] = useState(false)
  const [language, setLanguage] = useState<'en' | 'hi'>('en')
  const navigate = useNavigate()
  const { location, locationStatus } = usePreferences()
  const reduceMotion = useReducedMotion()
  const text = useMemo(() => copy[language], [language])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/categories?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <section className="hero-section neighborhood-hero" aria-labelledby="home-title">
      <div className="neighborhood-hero-inner container">
        <motion.div className="neighborhood-copy" initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0.01 : 0.5 }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> {text.eyebrow}</div>
          <h1 id="home-title">{text.title}<br /><span>{text.accent}</span></h1>
          <p className="neighborhood-subtitle">{text.subtitle}</p>
          <div className="neighborhood-actions">
            <Link className="button button-primary" to="/categories">{text.explore}<ArrowRight size={16} /></Link>
            <Link className="button button-secondary" to="/partner/register">{text.partner}</Link>
          </div>
          <form className="hero-search neighborhood-search" onSubmit={submitSearch}>
            <label className="search-location">
              <MapPin size={19} aria-hidden="true" />
              <span className="sr-only">{text.location}</span>
              <input aria-label={text.location} readOnly value={location?.label ?? (locationStatus === 'detecting' ? 'Detecting location…' : text.location)} />
            </label>
            <span className="search-divider" aria-hidden="true" />
            <label className="search-query">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">{text.search}</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} />
            </label>
            <button className="search-submit" type="submit" aria-label={text.searchButton}><ArrowRight size={20} /></button>
          </form>
          <p className="neighborhood-disclaimer"><span aria-hidden="true">✳</span> {text.preview}</p>
        </motion.div>
        <NeighborhoodExperience
          isNight={isNight}
          language={language}
          onToggleNight={() => setIsNight((value) => !value)}
          onToggleLanguage={() => setLanguage((value) => value === 'en' ? 'hi' : 'en')}
          text={text}
        />
      </div>
    </section>
  )
}
