import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Category } from '../data/categories'
import PhotoImage from './PhotoImage'
import { categoryPhotos } from '../data/imageCatalog'

interface CategoryCardProps {
  category: Category
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link className="category-card" to={`/category/${category.slug}`} aria-label={`Explore ${category.name}`}>
      <PhotoImage className="category-icon category-photo" photo={categoryPhotos[category.slug]} label={category.name} />
      <span className="category-card-title">{category.name}</span>
      <ArrowUpRight className="category-arrow" size={17} aria-hidden="true" />
    </Link>
  )
}
