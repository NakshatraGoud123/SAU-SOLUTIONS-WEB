import { ArrowRight, MapPin, Smartphone, Store, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="hero-section prelaunch-hero">
      <div className="hero-grid container">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> A local services vision, by SAU SOLUTIONS</div>
          <h1>Local life,<br />a little more <span>connected.</span></h1>
          <p className="hero-subtitle">SAU SERVICES is being prepared as a customer app for discovering local vendors, everyday essentials and services. The app has not launched on Google Play yet.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/app-coming-soon">SAU SERVICES — Coming Soon <ArrowRight size={16} /></Link>
            <Link className="text-link" to="/categories">Explore categories <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-proof"><div><strong>Pre-launch information</strong><small>No live orders, bookings or payments on this website</small></div></div>
        </motion.div>

        <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }}>
          <div className="visual-backdrop prelaunch-visual">
            <div className="hero-service-tile tile-home"><span className="tile-icon tone-violet"><Store size={22} /></span><div><strong>Local businesses</strong><small>Part of the planned ecosystem</small></div><MapPin size={17} /></div>
            <div className="hero-service-tile tile-grocery"><span className="tile-icon tone-green"><Wrench size={21} /></span><div><strong>Local services</strong><small>Category previews only</small></div><span className="tile-status">In preparation</span></div>
            <div className="visual-center-card">
              <div className="visual-card-top"><span className="mini-brand">s<span>.</span></span><span className="live-status"><i /> COMING SOON</span></div>
              <div className="prelaunch-app-mark"><span className="brand-mark"><span /><span /><span /></span><strong>SAU SERVICES</strong><small>Customer app · Pre-launch</small></div>
              <div className="visual-card-caption"><span>For customers and local partners</span><strong>One local services vision.</strong></div>
              <div className="visual-card-footer"><span><Smartphone size={15} /> Not on Google Play yet</span><Link to="/app-coming-soon" aria-label="Learn about the SAU SERVICES app"><ArrowRight size={17} /></Link></div>
            </div>
            <div className="floating-note note-rating"><span><MapPin size={13} /></span><div><strong>Local focus</strong><small>Coverage not confirmed</small></div></div>
            <div className="floating-note note-pro"><span><Smartphone size={20} /></span><div><strong>App coming soon</strong><small>Pre-launch updates</small></div></div>
            <div className="visual-caption"><span /> SAU SERVICES · PRE-LAUNCH</div>
          </div>
        </motion.div>
      </div>
      <div className="hero-bottom-glow" />
    </section>
  )
}
