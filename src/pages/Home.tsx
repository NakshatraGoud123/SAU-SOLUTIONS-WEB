import { ArrowRight, BriefcaseBusiness, Package, ShoppingBag, Smartphone, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import CategoryCard from '../components/CategoryCard'
import ServiceCard from '../components/ServiceCard'
import { foundingTeam } from '../data/team'
import { useCatalog } from '../context/useCatalog'

const platformAreas = [
  { title: 'Local services', description: 'Explore the active service listings and their published details.', icon: BriefcaseBusiness, href: '/categories', action: 'Explore services' },
  { title: 'Product categories', description: 'See the planned product categories; live product listings and stock are not published on this page.', icon: Package, href: '/products', action: 'View product categories' },
  { title: 'Partner information', description: 'Find out how local professionals and businesses can share their details.', icon: ShoppingBag, href: '/partner/register', action: 'Partner with SAU' },
]

const steps = [
  { number: '01', title: 'Explore categories', detail: 'Browse the categories and active listings in the current catalog.' },
  { number: '02', title: 'Review the details', detail: 'Check the listing description, price and any availability information provided.' },
  { number: '03', title: 'Continue where available', detail: 'Use the booking or product flow when that listing and service are enabled.' },
]

export default function Home() {
  const { categories, services, loading, error } = useCatalog()
  return (
    <>
      <Hero />
      <section className="section platform-section">
        <div className="container">
          <div className="section-heading">
            <div><span className="section-kicker">SAU SOLUTIONS PLATFORM</span><h2>Everyday needs, <span>in one place.</span></h2><p>Explore services, products and partner information through the existing SAU Solutions experience.</p></div>
          </div>
          <div className="ecosystem-grid platform-grid">
            {platformAreas.map(({ title, description, icon: Icon, href, action }) => <article className="ecosystem-card platform-card" key={title}>
              <span><Icon size={21} /></span><h3>{title}</h3><p>{description}</p><Link to={href}>{action} <ArrowRight size={15} /></Link>
            </article>)}
          </div>
          <p className="catalog-disclaimer">Listings and availability depend on the active catalog and participating partners; not every category has an available listing.</p>
        </div>
      </section>

      <section className="section category-section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div><span className="section-kicker">HERE FOR YOUR EVERYDAY</span><h2>One place for <span>all the things.</span></h2><p>Find the right help, essentials and little life upgrades — all close to home.</p></div>
            <Link to="/categories" className="text-link">Explore all categories <ArrowRight size={16} /></Link>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {loading ? <p role="status">Loading categories…</p> : <div className="category-grid">
            {categories.map((category, index) => <motion.div key={category.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.3, delay: (index % 8) * 0.025 }}><CategoryCard category={category} /></motion.div>)}
          </div>}
        </div>
      </section>

      <section className="section popular-section">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">CURRENT CATALOG</span><h2>Explore available <span>listings.</span></h2><p>Services and products shown here are loaded from the connected catalog.</p></div><Link to="/categories" className="text-link">See everything <ArrowRight size={16} /></Link></div>
          {loading ? <p role="status">Loading marketplace items…</p> : services.length > 0
            ? <div className="service-grid">{services.slice(0, 6).map((service) => <ServiceCard key={service.id} service={service} />)}</div>
            : !error && <p>No marketplace items are available yet.</p>}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="container how-layout">
          <div className="how-intro"><span className="section-kicker">HOW TO EXPLORE SAU</span><h2>Find your way<br /><span>around SAU.</span></h2><p>Start with the current catalog. Booking and product options depend on the active listing and supported flow.</p><Link to="/categories" className="button button-dark">Browse categories <ArrowRight size={16} /></Link></div>
          <div className="steps-list">{steps.map((step, index) => <motion.article className="step-item" key={step.number} initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.12 }}>
            <div className="step-number">{step.number}</div><div className="step-content"><h3>{step.title}</h3><p>{step.detail}</p></div><span className="step-spark"><Sparkles size={18} /></span>
          </motion.article>)}</div>
        </div>
      </section>

      <section className="container promo-panels">
        <article className="partner-panel" id="partner"><span className="section-kicker">FOR LOCAL PROFESSIONALS & BUSINESSES</span><h2>Tell us what<br />you bring to SAU.</h2><p>See partner information for independent professionals, local businesses and service teams.</p><Link className="button button-dark" to="/partner/register">Partner information <ArrowRight size={15} /></Link><span className="partner-decoration"><Sparkles size={35} /></span></article>
        <article className="app-panel" id="download"><span className="app-icon"><Smartphone size={24} /></span><span className="section-kicker">SAU SERVICES</span><h2>A connected<br />local platform.</h2><p>Browse the current catalog and learn more about the SAU SERVICES customer app pre-launch.</p><Link className="app-link" to="/app-coming-soon">App information <ArrowRight size={14} /></Link><span className="app-decoration">s<span>.</span></span></article>
      </section>

      <section className="team-section container" id="about">
        <div className="section-heading team-heading">
          <div>
            <span className="section-kicker">MEET OUR TEAM</span>
            <h2>Founding <span>leaders.</span></h2>
          </div>
        </div>
        <div className="team-grid">
          {foundingTeam.map((member) => (
            <article className="team-card" key={member.id}>
              <div className="team-avatar" role="img" aria-label={`Portrait placeholder for ${member.name}`}>{member.initials}</div>
              <div className="team-content">
                <h3>{member.name}</h3>
                <p className="team-designation">{member.designation}</p>
                <p>{member.bio}</p>
                <ul>
                  {member.responsibilities.map((responsibility) => (
                    <li key={responsibility}>{responsibility}</li>
                  ))}
                </ul>
                {member.linkedin ? (
                  <a href={member.linkedin} target="_blank" rel="noreferrer">LinkedIn profile</a>
                ) : (
                  <span className="team-placeholder">LinkedIn link to be provided</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section container" id="about-cta">
        <div className="cta-card">
          <div className="cta-orbit cta-orbit-one" /><div className="cta-orbit cta-orbit-two" />
          <div className="cta-content"><span className="cta-eyebrow"><span /> A BETTER KIND OF EVERYDAY</span><h2>Everything you need.<br />One <span>platform.</span></h2><p>From everyday essentials to trusted local professionals — more of what you need, in one thoughtful place.</p><div className="cta-actions"><Link to="/categories" className="button button-white">Get started <ArrowRight size={17} /></Link><span>No fuss. Just a better way.</span></div></div>
          <div className="cta-art" aria-hidden="true"><div className="cta-art-ring" /><div className="cta-art-core"><span className="cta-mark"><i /><i /><i /></span><span>SAU</span></div><div className="cta-chip chip-one">Your day, sorted <span>✳</span></div><div className="cta-chip chip-two"><span className="cta-chip-check">✓</span> All in one place</div></div>
        </div>
      </section>
    </>
  )
}
