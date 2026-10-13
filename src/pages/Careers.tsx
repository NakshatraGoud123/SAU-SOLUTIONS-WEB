import { ArrowRight, Bike, BriefcaseBusiness, Mail, Store, Users, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'
const WHATSAPP_URL = 'https://wa.me/919963182721?text=Hello%20SAU%20SOLUTIONS%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.'

const employmentInterests = [
  { title: 'Employees', description: 'Enquire about future team roles as the business and its needs develop.', icon: BriefcaseBusiness },
  { title: 'Interns', description: 'Share your interest in learning and contributing to future opportunities.', icon: Users },
]

const independentPartners = [
  { title: 'Local vendors and shops', description: 'Businesses interested in being discoverable on a future local platform.', icon: Store },
  { title: 'Service professionals', description: 'Independent professionals interested in sharing their services with local customers.', icon: Users },
  { title: 'Mechanics', description: 'Independent mechanics and repair providers interested in future partner information.', icon: Wrench },
  { title: 'Delivery partners', description: 'Individuals interested in future independent delivery opportunities.', icon: Bike },
]

export default function Careers() {
  return (
    <div className="information-page container">
      <header className="information-heading">
        <span className="section-kicker">CAREERS · SAU SOLUTIONS</span>
        <h1>Help shape a more <span>connected local future.</span></h1>
        <p>We welcome enquiries from people and local businesses interested in the future of SAU SOLUTIONS and the SAU SERVICES platform.</p>
      </header>

      <section className="information-callout">
        <span className="section-kicker">EMPLOYMENT ENQUIRIES</span>
        <h2>No current openings.</h2>
        <p>There are no advertised vacancies at this time. You can still enquire about future employee or internship opportunities; contacting us is an expression of interest, not a job application or promise of employment.</p>
        <a className="button button-primary" href={`mailto:${SUPPORT_EMAIL}?subject=Careers%20enquiry`}><Mail size={17} /> Enquire about future roles</a>
      </section>

      <section className="audience-section">
        <div className="section-heading"><div><span className="section-kicker">EMPLOYMENT INTEREST</span><h2>Future team <span>opportunities.</span></h2><p>Employment and internship enquiries are separate from independent partner onboarding.</p></div></div>
        <div className="ecosystem-grid career-employment-grid">{employmentInterests.map(({ title, description, icon: Icon }) => <article className="ecosystem-card" key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="audience-section career-partner-section">
        <div className="section-heading"><div><span className="section-kicker">INDEPENDENT PARTNER INTEREST</span><h2>Local partners, <span>working independently.</span></h2><p>These are potential vendor or partner relationships, not employee roles or guaranteed work. Any future participation would depend on partner onboarding, location, requirements and availability.</p></div></div>
        <div className="ecosystem-grid partner-types">{independentPartners.map(({ title, description, icon: Icon }) => <article className="ecosystem-card" key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="information-callout career-contact-callout">
        <strong>Want to enquire?</strong>
        <p>Tell us whether you are interested in employment, an internship, or independent partner information.</p>
        <div className="career-actions">
          <a className="button button-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Message us on WhatsApp <ArrowRight size={16} /></a>
          <Link className="text-link" to="/contact">Other contact options</Link>
        </div>
      </section>
    </div>
  )
}
