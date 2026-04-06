'use client'
import type { Variant } from '@/lib/types'
import VariantCard from './VariantCard'
import type { FeedbackState } from './FeedbackOverlay'
import './VariantGrid.css'

interface Props {
  variants: Variant[]
  loading: boolean
  sessionId?: string | null
  feedbackMap?: Record<string, FeedbackState>
  replacingIds?: Set<string>
  onExport: (element: HTMLElement, variant: Variant) => void
  onImageReady?: (variantId: string, dataUrl: string) => void
  onCollision?: (variantId: string) => void
}

export default function VariantGrid({ variants, loading, sessionId, feedbackMap, replacingIds, onExport, onImageReady, onCollision }: Props) {
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
        <VariantCard key={v.id} variant={v} sessionId={sessionId} initialFeedback={feedbackMap?.[v.id]} isReplacing={replacingIds?.has(v.id)} onExport={onExport} onImageReady={onImageReady} onCollision={onCollision} />
      ))}
    </div>
  )
}
