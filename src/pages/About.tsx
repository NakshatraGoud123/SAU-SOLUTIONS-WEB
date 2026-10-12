import { ArrowRight, Store, Users, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const audience = [
  { title: 'Customers', description: 'A planned customer app for exploring local essentials and services.', icon: Users },
  { title: 'Local businesses', description: 'A future place for shops and vendors to be part of a local services ecosystem.', icon: Store },
  { title: 'Service providers', description: 'A future platform concept that includes mechanics and other local professionals.', icon: Wrench },
]

export default function About() {
  return (
    <div className="information-page container">
      <header className="information-heading">
        <span className="section-kicker">ABOUT SAU SOLUTIONS</span>
        <h1>Building toward <span>local connections.</span></h1>
        <p>SAU SOLUTIONS is preparing SAU SERVICES, a customer app concept intended to bring local vendors, everyday needs and service providers together.</p>
      </header>
      <section className="information-callout">
        <strong>We’re in pre-launch.</strong>
        <p>The SAU SERVICES Customer App has not launched on Google Play yet. The categories and descriptions on this website introduce the intended ecosystem; they do not confirm live providers, offers or service availability.</p>
        <Link className="text-link" to="/app-coming-soon">SAU SERVICES app information <ArrowRight size={16} /></Link>
      </section>
      <section className="audience-section">
        <div className="section-heading"><div><span className="section-kicker">WHO IT’S FOR</span><h2>A local ecosystem <span>in preparation.</span></h2></div></div>
        <div className="ecosystem-grid">{audience.map(({ title, description, icon: Icon }) => <article className="ecosystem-card" key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section className="information-links">
        <Link to="/service-area"><strong>Service-area information</strong><span>See what is known—and what is not yet operating. <ArrowRight size={15} /></span></Link>
        <Link to="/partner/register"><strong>Partner interest</strong><span>Read the current partner information. <ArrowRight size={15} /></span></Link>
      </section>
    </div>
  )
}
