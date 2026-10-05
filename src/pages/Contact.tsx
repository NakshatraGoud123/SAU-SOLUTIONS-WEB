import { ArrowRight, Headset, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'

export default function Contact() {
  return <section className="contact-page container">
    <header className="contact-heading">
      <span className="section-kicker">WE’RE HERE TO HELP</span>
      <h1>A real person,<br /><span>when you need one.</span></h1>
      <p>Questions about an order, a booking, or joining SAU? Reach our support team by email.</p>
    </header>
    <div className="contact-support-card">
      <span className="contact-support-icon"><Headset size={25} /></span>
      <span className="section-kicker">SAU CUSTOMER SUPPORT</span>
      <h2>Let’s figure it out together.</h2>
      <p>Send us a note and include your order or booking details if you have them.</p>
      <a className="button button-primary" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={17} /> {SUPPORT_EMAIL} <ArrowRight size={15} /></a>
      <span className="contact-response-note"><ShieldCheck size={15} /> Your details are only shared when you send the email.</span>
    </div>
    <div className="contact-shortcuts">
      <Link to="/orders"><strong>Order or booking help</strong><span>Find your recent activity <ArrowRight size={15} /></span></Link>
      <Link to="/partner/register"><strong>Interested in becoming a partner?</strong><span>Start your partner registration <ArrowRight size={15} /></span></Link>
    </div>
  </section>
}
