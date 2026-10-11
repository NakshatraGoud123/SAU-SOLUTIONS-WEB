import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard'
import { categories } from '../data/categories'

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredCategories = useMemo(
    () => categories.filter((category) => `${category.name} ${category.description}`.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  )

  function updateQuery(value: string) {
    setQuery(value)
    if (value.trim()) setSearchParams({ q: value })
    else setSearchParams({})
  }

  return (
    <div className="listing-page">
      <section className="page-hero">
        <div className="container">
          <span className="section-kicker"><Sparkles size={14} /> CATEGORY PREVIEWS</span>
          <h1>Local needs, <span>in view.</span></h1>
          <p>Explore the kinds of local vendors and services SAU SERVICES is being prepared to support. These previews do not confirm live businesses or availability.</p>
          <label className="listing-search"><Search size={19} /><span className="sr-only">Search categories</span><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search category previews" /></label>
        </div>
      </section>
      <section className="container browse-categories">
        <div className="section-heading compact-heading"><div><span className="section-kicker">SAU SERVICES · PRE-LAUNCH</span><h2>{normalizedQuery ? 'Matching categories' : 'Explore category previews'}</h2></div><span className="result-count">{filteredCategories.length} categories</span></div>
        {filteredCategories.length > 0
          ? <div className="category-grid">{filteredCategories.map((category) => <CategoryCard key={category.slug} category={category} />)}</div>
          : <div className="empty-state"><span><Search size={22} /></span><h3>No categories found</h3><p>Try a different search.</p></div>}
        <p className="category-preview-note">Categories are informational previews. The customer app has not launched on Google Play yet, and this website does not accept orders or bookings.</p>
      </section>
    </div>
  )
}
