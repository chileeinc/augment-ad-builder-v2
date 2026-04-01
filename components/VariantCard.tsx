'use client'
import { useRef } from 'react'
import type { Variant } from '@/lib/types'
import AdRenderer from './AdRenderer'
import './VariantCard.css'

interface Props {
  variant: Variant
  onExport: (element: HTMLElement, variant: Variant) => void
}

export default function VariantCard({ variant, onExport }: Props) {
  const adRef = useRef<HTMLDivElement>(null)

  return (
    <div className="variant-card">
      <div className="variant-ad-wrap" ref={adRef}>
        <AdRenderer variant={variant} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="variant-meta">
        <div className="variant-tags">
          <span className="variant-tag accent">{variant.layout}</span>
          <span className="variant-tag">{variant.theme}</span>
          <span className="variant-tag">{variant.background}</span>
        </div>
        <div className="variant-reasoning">{variant.reasoning}</div>
      </div>
      <button className="variant-export-btn" onClick={() => adRef.current && onExport(adRef.current, variant)}>
        Export →
      </button>
    </div>
  )
}
