import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard'
import { categories, getCategory } from '../data/categories'
import PhotoImage from '../components/PhotoImage'
import { categoryPhotos } from '../data/imageCatalog'

export default function CategoryServices() {
  const { categorySlug, categoryId } = useParams()
  const activeCategoryId = categorySlug ?? categoryId
  const category = getCategory(activeCategoryId)

  if (!category) {
    return <section className="container empty-state missing-category"><span><Sparkles size={22} /></span><h1>We couldn’t find that category.</h1><p>Explore the SAU SERVICES category previews.</p><Link className="button button-primary" to="/categories">Explore categories</Link></section>
  }

  return (
    <div className="listing-page">
      <section className="category-detail-hero">
        <div className="container">
          <Link className="back-link" to="/categories"><ArrowLeft size={15} /> All categories</Link>
          <div className="category-detail-heading">
            <PhotoImage className="category-icon detail-category-icon category-photo" photo={categoryPhotos[category.slug]} label={category.name} />
            <div><span className="section-kicker">CATEGORY PREVIEW · PRE-LAUNCH</span><h1>{category.name}</h1><p>{category.description}</p></div>
          </div>
        </div>
      </section>
      <section className="container category-services-section">
        <div className="information-callout category-callout">
          <span className="section-kicker">INFORMATION ONLY</span>
          <h2>Not a live directory.</h2>
          <p>This category preview describes an area SAU SERVICES intends to support. It does not confirm that a provider, product, price, or service is currently available.</p>
          <Link className="text-link" to="/app-coming-soon">Customer app status <ArrowRight size={16} /></Link>
        </div>
      </section>
      <section className="container related-categories"><div className="section-heading compact-heading"><div><span className="section-kicker">KEEP EXPLORING</span><h2>There’s more to discover.</h2></div><Link to="/categories" className="text-link">All categories <ArrowLeft className="reverse-arrow" size={15} /></Link></div><div className="category-grid related-grid">{categories.filter((item) => item.slug !== category.slug).slice(0, 4).map((item) => <CategoryCard key={item.slug} category={item} />)}</div></section>
    </div>
  )
}
