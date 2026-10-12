import { useContext } from 'react'
import { CommerceContext } from './commerce-context'

export function useCommerce() {
  const context = useContext(CommerceContext)
  if (!context) throw new Error('useCommerce must be used within CommerceProvider')
  return context
}
