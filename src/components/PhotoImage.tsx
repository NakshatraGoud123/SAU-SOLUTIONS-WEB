import { useState } from 'react'
import type { MarketplacePhoto } from '../data/imageCatalog'

interface PhotoImageProps {
  photo: MarketplacePhoto | undefined
  label: string
  className?: string
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}

export default function PhotoImage({ photo, label, className = '', loading = 'lazy', fetchPriority = 'auto' }: PhotoImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!photo || failedSrc === photo.src) {
    return <span className={`photo-fallback ${className}`} role="img" aria-label={`Photo unavailable: ${label}`}>{label}</span>
  }

  return (
    <span className={`photo-frame ${className}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        onError={() => setFailedSrc(photo.src)}
      />
      {photo.credit && <span className="photo-credit">
        <a href={photo.credit.workUrl} target="_blank" rel="noreferrer">Photo: {photo.credit.name}</a>
        <a href={photo.credit.licenseUrl} target="_blank" rel="noreferrer">{photo.credit.license}</a>
      </span>}
    </span>
  )
}
