import { ArrowRight, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AppComingSoon({ notFound = false }: { notFound?: boolean }) {
  return (
    <section className="prelaunch-page container">
      <div className="prelaunch-card">
        <span className="prelaunch-icon"><Smartphone size={26} /></span>
        <span className="section-kicker">{notFound ? 'PAGE NOT FOUND' : 'SAU SERVICES CUSTOMER APP'}</span>
        <h1>{notFound ? 'Page not found.' : 'The app is in pre-launch.'}</h1>
        <p>{notFound
          ? 'That address does not match a page on the SAU Solutions website.'
          : 'The SAU SERVICES Customer App is not available on Google Play yet. This website shares information about the planned platform; listings and options shown here do not confirm current service availability.'}</p>
        {!notFound && <p className="prelaunch-note">There is no confirmed release date or download link yet. We’ll share an update when those details are confirmed.</p>}
        <div className="prelaunch-actions">
          <Link className="button button-primary" to={notFound ? '/' : '/categories'}>{notFound ? 'Go to homepage' : 'Explore category previews'} <ArrowRight size={16} /></Link>
          <Link className="text-link" to="/contact">Contact SAU Solutions</Link>
        </div>
      </div>
    </section>
  )
}
