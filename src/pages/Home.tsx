import { ArrowRight, Clock3, Download, MapPin, ShieldCheck, Smartphone, Sparkles, WalletCards } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import CategoryCard from '../components/CategoryCard'
import { categories } from '../data/categories'
import { services } from '../data/services'
import ServiceCard from '../components/ServiceCard'

const trustItems = [
  { title: 'Verified professionals', detail: 'People you can feel good about inviting in.', icon: ShieldCheck, tone: 'blue' },
  { title: 'Fast & reliable', detail: 'A little more certainty in your everyday.', icon: Clock3, tone: 'violet' },
  { title: 'Secure payments', detail: 'Clear pricing, with secure checkout ahead.', icon: WalletCards, tone: 'green' },
  { title: 'Available near you', detail: 'Helpful options, right around the corner.', icon: MapPin, tone: 'amber' },
]

const steps = [
  { number: '01', title: 'Choose what you need', detail: 'Find a service or everyday essential that fits your day.' },
  { number: '02', title: 'Book or order in a few taps', detail: 'Schedule a professional or add essentials to your bag.' },
  { number: '03', title: 'Sit back & relax', detail: 'We bring the right people and things a little closer.' },
]

export default function Home() {
  return (
    <>
      <Hero />
      <section className="trust-strip container" aria-label="Why choose SAU">
        {trustItems.map(({ title, detail, icon: Icon, tone }) => <div className="trust-item" key={title}>
          <span className={`trust-icon trust-${tone}`}><Icon size={21} strokeWidth={1.8} /></span>
          <div><strong>{title}</strong><span>{detail}</span></div>
        </div>)}
      </section>

      <section className="section category-section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div><span className="section-kicker">HERE FOR YOUR EVERYDAY</span><h2>One place for <span>all the things.</span></h2><p>Find the right help, essentials and little life upgrades — all close to home.</p></div>
            <Link to="/categories" className="text-link">Explore all categories <ArrowRight size={16} /></Link>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => <motion.div key={category.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.3, delay: (index % 8) * 0.025 }}><CategoryCard category={category} /></motion.div>)}
          </div>
        </div>
      </section>

      <section className="section popular-section">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">A FEW NEIGHBOURHOOD FAVOURITES</span><h2>Good things, <span>ready when you are.</span></h2><p>Everyday essentials and trusted professionals to make your next task easier.</p></div><Link to="/categories" className="text-link">See everything <ArrowRight size={16} /></Link></div>
          <div className="service-grid">{services.slice(0, 6).map((service) => <ServiceCard key={service.id} service={service} />)}</div>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="container how-layout">
          <div className="how-intro"><span className="section-kicker">NO RUNAROUND. JUST SAU.</span><h2>Good help.<br /><span>Less effort.</span></h2><p>Getting everyday things done should feel simple. We make it easier to find your next good experience.</p><Link to="/categories" className="button button-dark">Find what you need <ArrowRight size={16} /></Link></div>
          <div className="steps-list">{steps.map((step, index) => <motion.article className="step-item" key={step.number} initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.12 }}>
            <div className="step-number">{step.number}</div><div className="step-content"><h3>{step.title}</h3><p>{step.detail}</p></div><span className="step-spark"><Sparkles size={18} /></span>
          </motion.article>)}</div>
        </div>
      </section>

      <section className="container promo-panels">
        <article className="partner-panel" id="partner"><span className="section-kicker">GROW WITH SAU</span><h2>Good work deserves<br />to find more people.</h2><p>Bring your business or professional skills to a neighbourhood that needs you.</p><Link className="button button-dark" to="/register?type=partner">Become a partner <ArrowRight size={15} /></Link><span className="partner-decoration"><Sparkles size={35} /></span></article>
        <article className="app-panel" id="download"><span className="app-icon"><Smartphone size={24} /></span><span className="section-kicker">SAU, WHEREVER YOU GO</span><h2>Your everyday,<br />in your pocket.</h2><p>We’re getting the SAU app ready. Join us here to explore everything in one place.</p><Link className="app-link" to="/register"><Download size={15} /> Get early access <ArrowRight size={14} /></Link><span className="app-decoration">s<span>.</span></span></article>
      </section>

      <section className="cta-section container" id="about">
        <div className="cta-card">
          <div className="cta-orbit cta-orbit-one" /><div className="cta-orbit cta-orbit-two" />
          <div className="cta-content"><span className="cta-eyebrow"><span /> A BETTER KIND OF EVERYDAY</span><h2>Everything you need.<br />One <span>platform.</span></h2><p>From everyday essentials to trusted local professionals — more of what you need, in one thoughtful place.</p><div className="cta-actions"><Link to="/categories" className="button button-white">Get started <ArrowRight size={17} /></Link><span>No fuss. Just a better way.</span></div></div>
          <div className="cta-art" aria-hidden="true"><div className="cta-art-ring" /><div className="cta-art-core"><span className="cta-mark"><i /><i /><i /></span><span>SAU</span></div><div className="cta-chip chip-one">Your day, sorted <span>✳</span></div><div className="cta-chip chip-two"><span className="cta-chip-check">✓</span> All in one place</div></div>
        </div>
      </section>
    </>
  )
}
