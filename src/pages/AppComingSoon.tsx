import { ArrowRight, CalendarClock, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AppComingSoon({ notFound = false }: { notFound?: boolean }) {
  return (
    <section className="prelaunch-page container">
      <div className="prelaunch-card">
        <span className="prelaunch-icon"><Smartphone size={26} /></span>
        <span className="section-kicker">{notFound ? 'PAGE NOT FOUND' : 'SAU SERVICES CUSTOMER APP'}</span>
        <h1>{notFound ? 'This page isn’t available.' : 'The app is coming soon.'}</h1>
        <p>{notFound
          ? 'That address does not match a page on the SAU Solutions website.'
          : 'The SAU SERVICES Customer App has not launched on Google Play yet. The website does not process shopping, bookings, payments, orders, tracking or customer accounts.'}</p>
        {!notFound && <p className="prelaunch-note"><CalendarClock size={16} /> No launch date or download link is available yet. We’ll share confirmed details when they are ready.</p>}
        <div className="prelaunch-actions">
          <Link className="button button-primary" to="/categories">Explore category previews <ArrowRight size={16} /></Link>
          <Link className="text-link" to="/contact">Contact SAU Solutions</Link>
        </div>
      </div>
    </section>
  )
}
