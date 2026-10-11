import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ServiceArea() {
  return (
    <div className="information-page container">
      <header className="information-heading">
        <span className="section-kicker">SERVICE-AREA INFORMATION</span>
        <h1>Local focus, <span>pre-launch.</span></h1>
        <p>SAU SERVICES is being prepared with a local marketplace and services ecosystem in mind.</p>
      </header>
      <section className="information-callout">
        <span className="service-area-label"><MapPin size={18} /> Area discussed for an initial pilot</span>
        <h2>Himayatnagar, Hyderabad</h2>
        <p>This area has been discussed as a possible initial pilot. That does not mean SAU SERVICES is currently operating there or that any local service is available. Coverage will be confirmed before launch.</p>
      </section>
      <div className="prelaunch-actions"><Link className="button button-primary" to="/app-coming-soon">App pre-launch information <ArrowRight size={16} /></Link><Link className="text-link" to="/contact">Contact SAU Solutions</Link></div>
    </div>
  )
}
