import { ArrowRight, BriefcaseBusiness, MapPin, ShoppingBasket, Smartphone, Wrench } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import CategoryCard from '../components/CategoryCard'
import { categories } from '../data/categories'

const ecosystem = [
  { title: 'Local shops and vendors', detail: 'A planned place to discover local businesses.', icon: ShoppingBasket },
  { title: 'Service professionals', detail: 'A planned way to explore local services.', icon: Wrench },
  { title: 'Delivery partners', detail: 'Part of the wider SAU SERVICES vision.', icon: BriefcaseBusiness },
]

export default function Home() {
  const reduceMotion = useReducedMotion()
  return (
    <>
      <Hero />
      <section className="prelaunch-highlights container" aria-label="SAU SERVICES pre-launch information">
        <article><Smartphone size={21} /><div><strong>Customer app coming soon</strong><span>Not launched on Google Play yet.</span></div></article>
        <article><MapPin size={21} /><div><strong>Local ecosystem vision</strong><span>Planned for customers, local businesses and providers.</span></div></article>
      </section>

      <section className="section category-section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div><span className="section-kicker">CATEGORY PREVIEWS</span><h2>Explore the <span>local services vision.</span></h2><p>See the kinds of local businesses and services SAU SERVICES is being prepared to support.</p></div>
            <Link to="/categories" className="text-link">Explore categories <ArrowRight size={16} /></Link>
          </div>
          <div className="category-grid">
            {categories.slice(0, 8).map((category, index) => <motion.div key={category.slug} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : (index % 8) * 0.025 }}><CategoryCard category={category} /></motion.div>)}
          </div>
        </div>
      </section>

      <section className="section ecosystem-section">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">A LOCAL ECOSYSTEM</span><h2>Designed around <span>local connections.</span></h2><p>SAU SERVICES is being prepared as a customer app concept for local shopping and services. These are plans, not active services.</p></div></div>
          <div className="ecosystem-grid">{ecosystem.map(({ title, detail, icon: Icon }) => <article className="ecosystem-card" key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{detail}</p></article>)}</div>
        </div>
      </section>

      <section className="section app-coming-section container" id="app-coming-soon">
        <div className="app-coming-card">
          <span className="app-coming-icon"><Smartphone size={25} /></span>
          <span className="section-kicker">SAU SERVICES CUSTOMER APP</span>
          <h2>Coming soon.</h2>
          <p>The customer app has not launched on Google Play yet. This website does not take orders, bookings or payments. App availability and launch timing will be shared when confirmed.</p>
          <Link className="button button-white" to="/app-coming-soon">Get launch information <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="section partner-intro-section container">
        <div className="partner-intro-card">
          <span className="section-kicker">FOR LOCAL BUSINESSES AND PROVIDERS</span>
          <h2>Interested in the SAU SERVICES vision?</h2>
          <p>Learn about the existing partner-interest preview for local vendors, mechanics, service providers and delivery partners. It does not send an application to SAU.</p>
          <Link className="button button-dark" to="/partner/register">Partner information <ArrowRight size={16} /></Link>
        </div>
      </section>
    </>
  )
}
