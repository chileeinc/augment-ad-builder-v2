'use client'
import type { Variant, Platform } from '@/lib/types'
import { PLATFORM_SIZES, PLATFORM_LABELS, type AdSize } from '@/lib/constants'
import { exportAdElement } from '@/lib/export'
import './ExportModal.css'

interface Props {
  variant: Variant
  element: HTMLElement
  platforms: Platform[]
  onClose: () => void
}

export default function ExportModal({ variant, element, platforms, onClose }: Props) {
  const sizes: Array<AdSize & { platform: Platform }> = platforms.flatMap(p =>
    PLATFORM_SIZES[p].map(s => ({ ...s, platform: p }))
  )

  // Deduplicate by label (e.g. 1080×1080 appears on both LinkedIn and Instagram)
  const unique = sizes.filter(
    (s, i, arr) => arr.findIndex(x => x.label === s.label) === i
  )

  async function handleDownload(size: AdSize) {
    const filename = `augment-ad-${variant.layout}-${variant.theme}-${size.label}`
    await exportAdElement(element, size.width, size.height, filename)
  }

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div>
          <div className="export-modal-title">Export variant</div>
          <div className="export-modal-subtitle">
            {variant.layout} · {variant.theme} · {variant.background}
          </div>
        </div>
        <div className="export-sizes">
          {unique.map(s => (
            <button
              key={s.label}
              className="export-size-btn"
              onClick={() => handleDownload(s)}
            >
              <span className="export-size-label">{s.label}</span>
              <span className="export-size-platform">{PLATFORM_LABELS[s.platform]}</span>
            </button>
          ))}
        </div>
        <button className="export-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
