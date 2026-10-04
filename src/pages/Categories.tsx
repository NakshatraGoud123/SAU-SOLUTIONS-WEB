import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import CategoryCard from '../components/CategoryCard'
import ServiceCard from '../components/ServiceCard'
import { categories } from '../data/categories'
import { services } from '../data/services'

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredCategories = useMemo(() => categories.filter((category) => `${category.name} ${category.description}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery])
  const filteredServices = useMemo(() => services.filter((service) => `${service.name} ${service.description}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery])

  function updateQuery(value: string) {
    setQuery(value)
    if (value.trim()) setSearchParams({ q: value })
    else setSearchParams({})
  }

  return (
    <div className="listing-page">
      <section className="page-hero">
        <div className="container">
          <span className="section-kicker"><Sparkles size={14} /> YOUR DAY, A LITTLE EASIER</span>
          <h1>Find your kind of <span>help.</span></h1>
          <p>Browse thoughtful services and everyday essentials, all in one place.</p>
          <label className="listing-search"><Search size={19} /><span className="sr-only">Search services and categories</span><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Try “home cleaning” or “groceries”" /><span className="search-shortcut"><SlidersHorizontal size={15} /> Search</span></label>
        </div>
      </section>
      {!normalizedQuery && <section className="container browse-categories"><div className="section-heading compact-heading"><div><span className="section-kicker">A GOOD PLACE TO START</span><h2>Explore all categories</h2></div><span className="result-count">{categories.length} categories</span></div><div className="category-grid">{categories.map((category) => <CategoryCard key={category.slug} category={category} />)}</div></section>}
      {normalizedQuery && <section className="container results-section">
        <div className="section-heading compact-heading"><div><span className="section-kicker">SEARCH RESULTS</span><h2>Here’s what we found</h2></div><span className="result-count">{filteredCategories.length + filteredServices.length} results</span></div>
        {filteredCategories.length > 0 && <div className="category-grid search-category-grid">{filteredCategories.map((category) => <CategoryCard key={category.slug} category={category} />)}</div>}
        {filteredServices.length > 0 && <div className="search-service-results"><h3>Services & essentials</h3><div className="service-grid">{filteredServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div></div>}
        {filteredCategories.length === 0 && filteredServices.length === 0 && <div className="empty-state"><span><Search size={22} /></span><h3>No matches just yet</h3><p>Try a different search, or browse all of our categories instead.</p><button className="button button-primary" onClick={() => updateQuery('')}>Browse everything</button></div>}
      </section>}
    </div>
  )
}
