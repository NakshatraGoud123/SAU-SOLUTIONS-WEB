import { ArrowRight, MoveUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const footerGroups = [
  { title: 'Explore', links: [['Home', '/'], ['Category previews', '/categories'], ['What We Offer', '/what-we-offer'], ['Our Products', '/products'], ['SAU SERVICES app', '/app-coming-soon']] },
  { title: 'Company', links: [['About Us', '/about'], ['Careers', '/careers'], ['Service area', '/service-area'], ['Partner interest', '/partner/register'], ['Contact', '/contact']] },
]
const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-column">
          <Link className="wordmark footer-wordmark" to="/">
            <span className="brand-mark"><span /><span /><span /></span>
            <span className="brand-name">SAU<span>SOLUTIONS</span><small>LOCAL SERVICES · COMING SOON</small></span>
          </Link>
          <p>Preparing a local services<br />ecosystem for the future.</p>
          <Link className="footer-contact" to="/contact">Contact SAU Solutions <MoveUpRight size={14} /></Link>
        </div>
        {footerGroups.map((group) => <div className="footer-link-group" key={group.title}><h3>{group.title}</h3>{group.links.map(([label, href]) => <Link key={label} to={href}>{label}</Link>)}</div>)}
        <div className="footer-note"><span className="footer-note-icon"><ArrowRight size={19} /></span><strong>SAU SERVICES<br />coming soon.</strong><span>The customer app has not launched on Google Play yet. No transactions are available on this website.</span><Link to="/app-coming-soon">Pre-launch information <ArrowRight size={15} /></Link></div>
      </div>
      <div className="container footer-bottom"><span>© {currentYear} SAU Solutions.</span><span>Building for local connections <span className="footer-heart">✳</span></span></div>
    </footer>
  )
}
