'use client'
import { useRef, useState, useEffect } from 'react'
import type { Variant } from '@/lib/types'
import AdRenderer from './AdRenderer'
import FeedbackOverlay from './FeedbackOverlay'
import type { FeedbackState } from './FeedbackOverlay'
import './VariantCard.css'

const CANVAS_SIZE = 1080

interface Props {
  variant: Variant
  sessionId?: string | null
  initialFeedback?: FeedbackState | null
  isReplacing?: boolean
  onExport: (element: HTMLElement, variant: Variant) => void
  onImageReady?: (variantId: string, dataUrl: string) => void
  onCollision?: (variantId: string) => void
}

export default function VariantCard({ variant, sessionId, initialFeedback, isReplacing, onExport, onImageReady, onCollision }: Props) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / CANVAS_SIZE)
    })
    if (wrapRef.current) {
      obs.observe(wrapRef.current)
      setScale(wrapRef.current.offsetWidth / CANVAS_SIZE)
    }
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!onCollision || !exportRef.current) return
    const el = exportRef.current
    // Wait for paint + fonts
    const t = setTimeout(() => {
      const children = Array.from(el.querySelectorAll<HTMLElement>('[data-slot]'))
      const rects = children.map(c => c.getBoundingClientRect())
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j]
          if (a.width === 0 || b.width === 0) continue
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
            onCollision(variant.id)
            return
          }
        }
      }
    }, 400)
    return () => clearTimeout(t)
  }, [variant.id])

  useEffect(() => {
    if (!onImageReady || !exportRef.current) return
    const el = exportRef.current
    let cancelled = false

    const capture = async () => {
      try {
        const { toPng } = await import('html-to-image')
        await document.fonts?.ready
        await new Promise(r => setTimeout(r, 300))
        if (cancelled) return
        const dataUrl = await toPng(el, {
          canvasWidth: 540,
          canvasHeight: 540,
          pixelRatio: 1,
          cacheBust: true,
        })
        if (!cancelled) onImageReady(variant.id, dataUrl)
      } catch (e) {
        console.warn('[vision-capture] failed for', variant.id, e)
      }
    }

    capture()
    return () => { cancelled = true }
  }, [variant.id]) // only re-run if the variant changes

  const ev = variant.evaluation

  return (
    <div className="variant-card">
      <div className="variant-ad-wrap" ref={wrapRef}>
        <div
          className="variant-canvas"
          style={{ transform: `scale(${scale})` }}
        >
          <AdRenderer ref={exportRef} variant={variant} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} />
        </div>
        {isReplacing ? (
          <div className="variant-replacing-overlay">Fixing layout…</div>
        ) : (
          <FeedbackOverlay variantId={variant.id} sessionId={sessionId ?? null} initialFeedback={initialFeedback} />
        )}
      </div>
      <div className="variant-meta">
        <div className="variant-tags">
          <span className="variant-tag accent">{variant.concept}</span>
        </div>
        <div className="variant-reasoning">{variant.reasoning}</div>
        {ev && (
          <div className="variant-scores">
            <span className="score-item"><span className="score-label">CD</span>{ev.designer.overall.toFixed(1)}</span>
            <span className="score-item"><span className="score-label">TASTE</span>{ev.taste_maker.overall.toFixed(1)}</span>
            <span className="score-item"><span className="score-label">GROWTH</span>{ev.growth_hacker.overall.toFixed(1)}</span>
          </div>
        )}
      </div>
      <button
        className="variant-export-btn"
        onClick={() => exportRef.current && onExport(exportRef.current, variant)}
      >
        Export →
      </button>
    </div>
  )
}
