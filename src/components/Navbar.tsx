import { motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, ChevronLeft, ChevronRight, Contact, Home, Info, Layers3, Moon, Package, Sun, Users, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { usePreferences } from '../context/usePreferences'

const links = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Categories', href: '/categories', icon: Layers3 },
  { label: 'About Us', href: '/about', icon: Info },
  { label: 'Careers', href: '/careers', icon: BriefcaseBusiness },
  { label: 'What We Offer', href: '/what-we-offer', icon: Wrench },
  { label: 'Our Products', href: '/products', icon: Package },
  { label: 'Service Area', href: '/service-area', icon: Contact },
  { label: 'Partner Interest', href: '/partner/register', icon: Users },
  { label: 'Contact', href: '/contact', icon: Contact },
]

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggleTheme } = usePreferences()
  return <motion.aside className={`site-header glass-sidebar${collapsed ? ' sidebar-collapsed' : ''}`} animate={{ width: collapsed ? 76 : 248 }} transition={{ duration: .25, ease: 'easeInOut' }}>
    <nav className="sidebar-nav" aria-label="Main navigation">
      <Link className="wordmark" to="/" aria-label="SAU Solutions home"><span className="brand-mark"><span /><span /><span /></span>{!collapsed && <span className="brand-name">SAU<span>SOLUTIONS</span><small>LOCAL SERVICES · COMING SOON</small></span>}</Link>
      <div className="nav-links">
        {links.map(({ label, href, icon: Icon }) => <NavLink key={label} to={href} end={href === '/'} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}><Icon size={19} /><span>{label}</span></NavLink>)}
      </div>
      <div className="sidebar-bottom">
        <Link className="sidebar-coming" to="/app-coming-soon" title={collapsed ? 'App coming soon' : undefined}><span className="sidebar-coming-icon"><ArrowRight size={17} /></span>{!collapsed && <span>App coming soon</span>}</Link>
        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}<span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>
        <button className="sidebar-collapse" type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand sidebar and show page names' : 'Collapse sidebar to icons'} aria-expanded={!collapsed} title={collapsed ? 'Expand sidebar and show page names' : 'Collapse sidebar to icons'}>{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}<span>{collapsed ? 'Expand' : 'Collapse'}</span></button>
      </div>
    </nav>
  </motion.aside>
}
