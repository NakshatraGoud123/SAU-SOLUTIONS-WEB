import { fetchMarketplaceCatalog } from './catalogService'

export async function fetchCategories() {
  const catalog = await fetchMarketplaceCatalog()
  return { data: catalog.categories, error: null }
}

export async function fetchActiveCategories() {
  return fetchCategories()
}
