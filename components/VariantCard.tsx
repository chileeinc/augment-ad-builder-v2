'use client'
import { useCallback } from 'react'
import type { Variant } from '@/lib/types'
import AdRenderer from './AdRenderer'
import './VariantCard.css'

interface Props {
  variant: Variant
  registerRef: (id: string, el: HTMLDivElement | null) => void
}

export default function VariantCard({ variant, registerRef }: Props) {
  const setRef = useCallback(
    (el: HTMLDivElement | null) => registerRef(variant.id, el),
    [variant.id, registerRef]
  )

  return (
    <div className="variant-card">
      <div className="variant-ad-wrap" ref={setRef}>
        <AdRenderer
          variant={variant}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="variant-meta">
        <div className="variant-tags">
          <span className="variant-tag accent">{variant.layout}</span>
          <span className="variant-tag">{variant.theme}</span>
          <span className="variant-tag">{variant.background}</span>
          <span className="variant-tag">{variant.copy_angle}</span>
        </div>
        <div className="variant-reasoning">{variant.reasoning}</div>
      </div>
    </div>
  )
}
