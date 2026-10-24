import { ArrowRight, MoveUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'Sausolution.support@gmail.com'
const footerGroups = [
  { title: 'Explore', links: [['Platform', '/'], ['Categories', '/categories'], ['How it works', '/#how-it-works'], ['Become a partner', '/partner/register'], ['Contact us', '/contact']] },
  { title: 'Company', links: [['About SAU', '/about'], ['Customer support', `mailto:${SUPPORT_EMAIL}`], ['Partner support', `mailto:${SUPPORT_EMAIL}?subject=Partner%20support`], ['Contact', '/contact']] },
  { title: 'The details', links: [['Privacy enquiries', `mailto:${SUPPORT_EMAIL}?subject=Privacy%20policy`], ['Terms enquiries', `mailto:${SUPPORT_EMAIL}?subject=Terms%20of%20service`], ['Support email', `mailto:${SUPPORT_EMAIL}`]] },
]
const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-column">
          <Link className="wordmark footer-wordmark" to="/">
            <img className="brand-logo" src={`${import.meta.env.BASE_URL}sau-logo.jpeg`} alt="" />
            <span className="brand-name">SAU<span>SOLUTIONS</span><small>ALL SERVICES IN ONE APP</small></span>
          </Link>
          <p>More time for what matters.<br />A little less to figure out.</p>
          <a className="footer-contact" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL} <MoveUpRight size={14} /></a>
        </div>
        {footerGroups.map((group) => <div className="footer-link-group" key={group.title}><h3>{group.title}</h3>{group.links.map(([label, href]) => href.startsWith('mailto:') ? <a key={label} href={href}>{label}</a> : <Link key={label} to={href}>{label}</Link>)}</div>)}
        <div className="footer-note"><span className="footer-note-icon"><ArrowRight size={19} /></span><strong>Everyday life,<br />a little more effortless.</strong><span>Discover something helpful</span><Link to="/categories">Explore SAU <ArrowRight size={15} /></Link></div>
      </div>
      <div className="container footer-bottom"><span>© {currentYear} SAU Solutions. Made for everyday life.</span><span>Thoughtfully bringing it all together <span className="footer-heart">✳</span></span></div>
    </footer>
  )
}
