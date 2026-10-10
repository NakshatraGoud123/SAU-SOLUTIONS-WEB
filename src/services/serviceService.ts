import { fetchMarketplaceCatalog } from './catalogService'

export async function fetchServices() {
  const catalog = await fetchMarketplaceCatalog()
  return { data: catalog.services.filter((service) => service.kind === 'professional'), error: null }
}

export async function fetchServicesByCategory(categorySlug: string) {
  const catalog = await fetchMarketplaceCatalog()
  return { data: catalog.services.filter((service) => service.kind === 'professional' && service.categorySlug === categorySlug), error: null }
}

export async function fetchService(serviceId: string) {
  const catalog = await fetchMarketplaceCatalog()
  return { data: catalog.services.find((service) => service.id === serviceId && service.kind === 'professional') ?? null, error: null }
}
