import { ArrowRight, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'

export default function Contact() {
  return <section className="contact-page container">
    <header className="contact-heading">
      <span className="section-kicker">CONTACT SAU SOLUTIONS</span>
      <h1>Questions about<br /><span>SAU SERVICES?</span></h1>
      <p>For general questions about SAU SOLUTIONS and the app pre-launch, you can start an email to the address below.</p>
    </header>
    <div className="contact-support-card">
      <span className="contact-support-icon"><Mail size={25} /></span>
      <span className="section-kicker">GENERAL ENQUIRIES</span>
      <h2>Contact by email.</h2>
      <p>Selecting the address opens your email app. Your message is sent only if you choose to send it; this website does not submit or track enquiries.</p>
      <a className="button button-primary" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={17} /> {SUPPORT_EMAIL} <ArrowRight size={15} /></a>
    </div>
    <div className="contact-shortcuts">
      <Link to="/app-coming-soon"><strong>SAU SERVICES Customer App</strong><span>View pre-launch information <ArrowRight size={15} /></span></Link>
      <Link to="/partner/register"><strong>Interested in the partner vision?</strong><span>View partner information <ArrowRight size={15} /></span></Link>
    </div>
  </section>
}
