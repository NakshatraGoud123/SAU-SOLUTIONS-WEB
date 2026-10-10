import { createContext } from 'react'
import type { Category } from '../data/categories'
import type { Service } from '../data/services'

export interface CatalogState {
  categories: Category[]
  services: Service[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
}

export const CatalogContext = createContext<CatalogState | null>(null)
