import { categories as knownCategories } from '../data/categories'
import type { Category } from '../data/categories'
import type { Service, ServiceKind } from '../data/services'
import { requireSupabaseClient } from '../lib/supabase'

interface CatalogCategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
}

interface CatalogItemRow {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  price: number
  duration?: string | null
  stock?: number | null
  is_active: boolean
  categories: { slug: string } | { slug: string }[] | null
}

function categorySlugFor(row: CatalogItemRow, categorySlugs: Map<string, string>) {
  const joinedCategory = Array.isArray(row.categories) ? row.categories[0] : row.categories
  if (joinedCategory?.slug) return joinedCategory.slug
  return row.category_id ? categorySlugs.get(row.category_id) ?? '' : ''
}

function mapCatalogItem(row: CatalogItemRow, kind: ServiceKind, categorySlugs: Map<string, string>): Service {
  return {
    id: row.id,
    categorySlug: categorySlugFor(row, categorySlugs),
    name: row.name,
    description: row.description ?? '',
    kind,
    price: Number(row.price),
    priceUnit: kind === 'product' ? 'each' : 'starting at',
    rating: 0,
    reviews: 0,
    eta: row.duration || (kind === 'product' ? 'Delivery timing confirmed at checkout' : 'Schedule a time'),
    icon: 'sparkles',
    tone: 'blue',
    catalogKey: row.slug,
    imageUrl: row.image_url,
  }
}

export async function fetchMarketplaceCatalog(): Promise<{ categories: Category[]; services: Service[] }> {
  const client = requireSupabaseClient()
  const [categoryResult, serviceResult, productResult] = await Promise.all([
    client.from('categories')
      .select('id, name, slug, description, image_url, is_active')
      .eq('is_active', true)
      .order('name'),
    client.from('services')
      .select('id, category_id, name, slug, description, image_url, price, duration, is_active')
      .eq('is_active', true),
    client.from('products')
      .select('id, category_id, name, slug, description, image_url, price, stock, is_active')
      .eq('is_active', true),
  ])

  if (categoryResult.error) throw new Error(categoryResult.error.message)
  if (serviceResult.error) throw new Error(serviceResult.error.message)
  if (productResult.error) throw new Error(productResult.error.message)

  const categoryRows = categoryResult.data as CatalogCategoryRow[]
  const categorySlugs = new Map(categoryRows.map((row) => [row.id, row.slug]))
  const presentationBySlug = new Map(knownCategories.map((category) => [category.slug, category]))
  const categories = categoryRows.map((row) => {
    const presentation = presentationBySlug.get(row.slug)
    return {
      slug: row.slug,
      name: row.name,
      description: row.description ?? '',
      icon: presentation?.icon ?? 'grid-2x2',
      tone: presentation?.tone ?? 'blue',
      imageUrl: row.image_url,
    }
  })
  const professionalServices = (serviceResult.data as CatalogItemRow[]).map((row) => mapCatalogItem(row, 'professional', categorySlugs))
  const products = (productResult.data as CatalogItemRow[])
    .filter((row) => row.stock === undefined || (row.stock !== null && row.stock > 0))
    .map((row) => mapCatalogItem(row, 'product', categorySlugs))

  return { categories, services: [...professionalServices, ...products] }
}
