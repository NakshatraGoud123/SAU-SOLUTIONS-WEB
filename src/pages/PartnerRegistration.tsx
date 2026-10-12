import { ArrowRight, Bike, BriefcaseBusiness, Mail, Store, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'
const partnerEmailSubject = encodeURIComponent('SAU SERVICES partner interest')
const partnerEmailBody = encodeURIComponent([
  'Hello SAU SOLUTIONS,',
  '',
  'I am interested in learning about the SAU SERVICES pre-launch partner process.',
  'Partner type: [local vendor/shop owner / mechanic / service provider / delivery partner]',
  'Locality: [your area/locality]',
  '',
  'Please share information when available.',
].join('\n'))

export default function PartnerRegistration() {
  return (
    <div className="information-page container">
      <header className="information-heading">
        <span className="section-kicker">PARTNER INTEREST · PRE-LAUNCH</span>
        <h1>Local partners are part of <span>the plan.</span></h1>
        <p>SAU SOLUTIONS is preparing the partner-interest process for the SAU SERVICES ecosystem.</p>
      </header>
      <section className="ecosystem-grid partner-types">
        <article className="ecosystem-card"><span><Store size={21} /></span><h3>Local vendors</h3><p>Shops and businesses interested in a future local marketplace.</p></article>
        <article className="ecosystem-card"><span><Wrench size={21} /></span><h3>Mechanics and service providers</h3><p>Independent professionals and local service teams.</p></article>
        <article className="ecosystem-card"><span><Bike size={21} /></span><h3>Delivery partners</h3><p>People interested in learning about future delivery opportunities.</p></article>
        <article className="ecosystem-card"><span><BriefcaseBusiness size={21} /></span><h3>Local service teams</h3><p>Businesses exploring participation in the planned ecosystem.</p></article>
      </section>
      <section className="information-callout partner-interest-notice">
        <strong>Interested in joining SAU SERVICES?</strong>
        <a className="button button-primary partner-email-button" href={`mailto:${SUPPORT_EMAIL}?subject=${partnerEmailSubject}&body=${partnerEmailBody}`}><Mail size={18} /> Ask about partner opportunities <ArrowRight size={16} /></a>
        <p className="partner-contact-note">This opens your email app with a draft. The email is sent only if you choose to send it. Your message is handled by your email provider and SAU SOLUTIONS if delivered.</p>
      </section>
      <div className="prelaunch-actions"><Link className="button button-primary" to="/about">About SAU Solutions <ArrowRight size={16} /></Link><Link className="text-link" to="/contact">General contact information</Link></div>
    </div>
  )
}
