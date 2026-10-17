import { ArrowRight, Eye, Route, Target, Truck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const platformSteps = [
  { title: 'Discover', description: 'Customers browse categories and participating local businesses in their service area.', icon: Eye },
  { title: 'Connect', description: 'Customers find relevant products or services and connect through the available platform options.', icon: Users },
  { title: 'Fulfil locally', description: 'Participating vendors and service professionals handle requests, with delivery partners supporting eligible deliveries.', icon: Truck },
]

export default function About() {
  return (
    <div className="information-page container">
      <header className="information-heading">
        <span className="section-kicker">ABOUT SAU SOLUTIONS</span>
        <h1>Connecting local needs with <span>local know-how.</span></h1>
        <p>SAU SOLUTIONS is building SAU SERVICES, a platform designed to help customers discover local shops, vendors, service professionals, mechanics and delivery partners in one place.</p>
      </header>
      <section className="information-callout">
        <span className="section-kicker">OUR PURPOSE</span>
        <h2>Make local discovery feel more connected.</h2>
        <p>Our mission is to make it easier for customers to find everyday products and useful local services, while creating a clear way for neighborhood businesses and independent professionals to be discovered.</p>
        <p>SAU SERVICES is in pre-launch. Categories on this website describe the intended platform and do not confirm that a provider or service is currently available.</p>
      </section>
      <section className="audience-section">
        <div className="section-heading"><div><span className="section-kicker">OUR VISION</span><h2>A useful local network, <span>built around people.</span></h2><p>Bring customers and participating neighborhood businesses closer through an accessible digital platform.</p></div></div>
        <div className="ecosystem-grid about-values-grid">
          <article className="ecosystem-card"><span><Target size={21} /></span><h3>Mission</h3><p>Connect customers with local vendors, shops, service professionals and mechanics for everyday needs.</p></article>
          <article className="ecosystem-card"><span><Eye size={21} /></span><h3>Vision</h3><p>Support a more connected local ecosystem where discovery and access can grow with participating partners and service areas.</p></article>
          <article className="ecosystem-card"><span><Route size={21} /></span><h3>How it works</h3><p>Customers explore what is available locally; participating businesses and professionals provide the products and services.</p></article>
        </div>
      </section>
      <section className="audience-section about-process-section">
        <div className="section-heading"><div><span className="section-kicker">THE PLATFORM JOURNEY</span><h2>Simple steps toward <span>local connection.</span></h2></div></div>
        <div className="ecosystem-grid about-values-grid">{platformSteps.map(({ title, description, icon: Icon }, index) => <article className="ecosystem-card" key={title}><span><Icon size={21} /></span><small className="about-step-label">STEP 0{index + 1}</small><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section className="information-callout about-prelaunch-callout">
        <strong>Currently in pre-launch</strong>
        <p>The SAU SERVICES Customer App has not launched on Google Play yet. Availability depends on the service area and participating partners.</p>
        <Link className="text-link" to="/app-coming-soon">SAU SERVICES app information <ArrowRight size={16} /></Link>
      </section>
      <section className="information-links">
        <Link to="/what-we-offer"><strong>What We Offer</strong><span>Explore the intended range of local categories. <ArrowRight size={15} /></span></Link>
        <Link to="/partner/register"><strong>Partner interest</strong><span>Read information for local vendors and providers. <ArrowRight size={15} /></span></Link>
      </section>
    </div>
  )
}
