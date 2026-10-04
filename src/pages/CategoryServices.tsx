import { useMemo, useState } from 'react'
import { ArrowLeft, Search, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard'
import ServiceCard from '../components/ServiceCard'
import { categories, getCategory } from '../data/categories'
import { getServicesForCategory } from '../data/services'
import PhotoImage from '../components/PhotoImage'
import { categoryPhotos } from '../data/imageCatalog'

export default function CategoryServices() {
  const { categorySlug, categoryId } = useParams()
  const activeCategoryId = categorySlug ?? categoryId
  const category = getCategory(activeCategoryId)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const items = useMemo(() => activeCategoryId ? getServicesForCategory(activeCategoryId) : [], [activeCategoryId])
  const filteredItems = items
    .filter((service) => `${service.name} ${service.description}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'rating' ? b.rating - a.rating : 0)

  if (!category) {
    return <section className="container empty-state missing-category"><span><Sparkles size={22} /></span><h1>That category is taking a break.</h1><p>Explore all the other useful things waiting for you.</p><Link className="button button-primary" to="/categories">Explore categories</Link></section>
  }

  return (
    <div className="listing-page">
      <section className="category-detail-hero">
        <div className="container">
          <Link className="back-link" to="/categories"><ArrowLeft size={15} /> All categories</Link>
          <div className="category-detail-heading">
            <PhotoImage className="category-icon detail-category-icon category-photo" photo={categoryPhotos[category.slug]} label={category.name} />
            <div><span className="section-kicker">A LITTLE HELP, RIGHT HERE</span><h1>{category.name}</h1><p>{category.description}</p></div>
          </div>
          <label className="listing-search category-search"><Search size={19} /><span className="sr-only">Search in {category.name}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${category.name.toLowerCase()}...`} /></label>
        </div>
      </section>
      <section className="container category-services-section">
        <div className="section-heading compact-heading"><div><span className="section-kicker">MADE FOR YOUR DAY</span><h2>{query ? 'Matching for you' : 'Popular right now'}</h2></div><div className="category-controls"><span className="result-count">{filteredItems.length} options</span><label className="sort-control">Sort by <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recommended">Recommended</option><option value="rating">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div></div>
        {filteredItems.length > 0 ? <div className="service-grid">{filteredItems.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <div className="empty-state"><span><Search size={22} /></span><h3>No options found</h3><p>Try a different search within {category.name.toLowerCase()}.</p></div>}
      </section>
      <section className="container related-categories"><div className="section-heading compact-heading"><div><span className="section-kicker">KEEP EXPLORING</span><h2>There’s more to discover.</h2></div><Link to="/categories" className="text-link">All categories <ArrowLeft className="reverse-arrow" size={15} /></Link></div><div className="category-grid related-grid">{categories.filter((item) => item.slug !== category.slug).slice(0, 4).map((item) => <CategoryCard key={item.slug} category={item} />)}</div></section>
    </div>
  )
}
