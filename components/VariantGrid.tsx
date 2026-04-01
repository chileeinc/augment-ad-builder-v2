'use client'
import type { Variant } from '@/lib/types'
import VariantCard from './VariantCard'
import './VariantGrid.css'

interface Props {
  variants: Variant[]
  loading: boolean
  registerRef: (id: string, el: HTMLDivElement | null) => void
}

export default function VariantGrid({ variants, loading, registerRef }: Props) {
  if (loading) {
    return (
      <div className="variant-grid-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-ad" />
            <div className="skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton-line" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (variants.length === 0) return null

  return (
    <div className="variant-grid">
      {variants.map(v => (
        <VariantCard key={v.id} variant={v} registerRef={registerRef} />
      ))}
    </div>
  )
}
