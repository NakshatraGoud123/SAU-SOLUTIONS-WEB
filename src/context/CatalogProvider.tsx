import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CatalogContext } from './catalog-context'
import { categories as categoryPresentation } from '../data/categories'
import type { Category } from '../data/categories'
import type { Service } from '../data/services'
import { fetchMarketplaceCatalog } from '../services/catalogService'

function mapCatalog(catalog: Awaited<ReturnType<typeof fetchMarketplaceCatalog>>) {
  const presentationBySlug = new Map(categoryPresentation.map((category) => [category.slug, category]))
  return {
    categories: catalog.categories.map((category) => ({
      ...category,
      icon: presentationBySlug.get(category.slug)?.icon ?? 'grid-2x2',
      tone: presentationBySlug.get(category.slug)?.tone ?? 'blue',
    })),
    services: catalog.services.map((service) => {
      const presentation = categoryPresentation.find((category) => category.slug === service.categorySlug)
      return {
        ...service,
        icon: service.kind === 'product' ? presentation?.icon ?? 'package' : presentation?.icon ?? 'sparkles',
        tone: presentation?.tone ?? 'blue',
      }
    }),
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const mapped = mapCatalog(await fetchMarketplaceCatalog())
      setCategories(mapped.categories)
      setServices(mapped.services)
    } catch (cause) {
      console.error('Could not load the marketplace catalog.', cause)
      setCategories([])
      setServices([])
      setError('Unable to load marketplace items. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchMarketplaceCatalog().then((catalog) => {
      if (!active) return
      const mapped = mapCatalog(catalog)
      setCategories(mapped.categories)
      setServices(mapped.services)
    }).catch((cause: unknown) => {
      console.error('Could not load the marketplace catalog.', cause)
      if (active) {
        setCategories([])
        setServices([])
        setError('Unable to load marketplace items. Please try again.')
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const value = useMemo(() => ({ categories, services, loading, error, refresh }), [categories, services, loading, error, refresh])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
