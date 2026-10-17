import { ArrowRight, MessageCircle, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard'
import { categories } from '../data/categories'

const productCategorySlugs = new Set([
  'essential-supplies',
  'home-essentials',
  'food-beverages',
  'healthcare-pharmacy',
])
const productCategories = categories.filter((category) => productCategorySlugs.has(category.slug))
const WHATSAPP_URL = 'https://wa.me/919963182721?text=Hello%20SAU%20SOLUTIONS%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.'

export default function Products() {
  return (
    <div className="information-page container products-page">
      <header className="information-heading">
        <span className="section-kicker"><ShoppingBasket size={14} /> OUR PRODUCTS</span>
        <h1>Discover local <span>product categories.</span></h1>
        <p>Explore the kinds of products participating neighborhood shops and vendors may offer through SAU SERVICES.</p>
      </header>
      <section className="products-disclaimer information-callout">
        <strong>Category overview only</strong>
        <p>Live product listings, prices, stock status and checkout are not available on this website. The categories below are an overview, not a promise that products or vendors are currently available.</p>
      </section>
      <section className="products-category-section">
        <div className="section-heading"><div><span className="section-kicker">PRODUCT DISCOVERY</span><h2>Browse product <span>categories.</span></h2><p>Specific products depend on your service area and participating vendors.</p></div></div>
        <div className="category-grid products-category-grid">{productCategories.map((category) => <CategoryCard key={category.slug} category={category} />)}</div>
      </section>
      <section className="information-callout products-enquiry">
        <strong>Ask about local product availability</strong>
        <p>Contact SAU SOLUTIONS to learn more about the platform and its planned local product categories.</p>
        <div className="career-actions">
          <a className="button button-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Ask on WhatsApp <ArrowRight size={15} /></a>
          <Link className="text-link" to="/contact">Other contact options</Link>
        </div>
      </section>
    </div>
  )
}
