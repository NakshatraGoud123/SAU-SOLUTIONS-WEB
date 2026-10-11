import { ArrowRight, Bike, BriefcaseBusiness, MessageCircle, Store, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const partnerWhatsAppNumber = import.meta.env.VITE_SAU_PARTNER_WHATSAPP_NUMBER?.trim() ?? ''
const hasValidWhatsAppNumber = /^\d{8,15}$/.test(partnerWhatsAppNumber)
const partnerWhatsAppMessage = [
  'Hi SAU SOLUTIONS, I’m interested in joining SAU SERVICES.',
  'Partner type: [local vendor/shop owner / mechanic / service provider / delivery partner]',
  'Locality: [your area/locality]',
  'Please share information about the pre-launch partner process.',
].join('\n')
const partnerWhatsAppUrl = hasValidWhatsAppNumber
  ? `https://wa.me/${partnerWhatsAppNumber}?text=${encodeURIComponent(partnerWhatsAppMessage)}`
  : undefined

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
        {partnerWhatsAppUrl
          ? <a className="button button-primary partner-whatsapp-button" href={partnerWhatsAppUrl} target="_blank" rel="noopener noreferrer" aria-describedby="partner-whatsapp-privacy"><MessageCircle size={18} /> Express Interest on WhatsApp <ArrowRight size={16} /></a>
          : <button className="button button-primary partner-whatsapp-button" type="button" disabled aria-describedby="partner-whatsapp-status partner-whatsapp-privacy"><MessageCircle size={18} /> Express Interest on WhatsApp</button>}
        <p id="partner-whatsapp-status" className={hasValidWhatsAppNumber ? 'partner-whatsapp-status partner-whatsapp-status-ready' : 'partner-whatsapp-status'} aria-live="polite">
          {hasValidWhatsAppNumber ? 'WhatsApp will open with a message draft.' : 'Partner enquiries via WhatsApp will be available soon.'}
        </p>
        <p id="partner-whatsapp-privacy" className="partner-whatsapp-privacy">
          {hasValidWhatsAppNumber
            ? 'The button opens WhatsApp in a new tab with a draft asking for your partner type and locality. The message is sent only if you send it in WhatsApp. This website does not collect or store your information.'
            : 'No visitor information is collected or stored on this website. When available, the button will open WhatsApp; the message will be sent only if you send it there.'}
        </p>
      </section>
      <div className="prelaunch-actions"><Link className="button button-primary" to="/about">About SAU Solutions <ArrowRight size={16} /></Link><Link className="text-link" to="/contact">General contact information</Link></div>
    </div>
  )
}
