'use client'
import { useState } from 'react'
import type { Variant, Platform } from '@/lib/types'
import { PLATFORM_SIZES, PLATFORM_LABELS } from '@/lib/constants'
import { exportAdElement } from '@/lib/export'
import './ExportModal.css'

interface Props {
  variant: Variant
  element: HTMLElement
  platforms: Platform[]
  onClose: () => void
}

export default function ExportModal({ variant, element, platforms, onClose }: Props) {
  const [downloading, setDownloading] = useState<Platform | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleDownload(platform: Platform) {
    const size = PLATFORM_SIZES[platform]
    setDownloading(platform)
    setExportError(null)
    try {
      const varLabel = `var${variant.id.replace(/^v/, '')}`
      const filename = `${platform}-${size.label.replace(':', 'x')}-${varLabel}`
      await exportAdElement(element, size.width, size.height, filename)
    } catch (err) {
      console.error('[export]', err)
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setDownloading(null)
    }
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
        <div className="export-platforms">
          {platforms.map(p => {
            const size = PLATFORM_SIZES[p]
            return (
              <button
                key={p}
                className="export-platform-btn"
                onClick={() => handleDownload(p)}
                disabled={downloading !== null}
              >
                <span className="export-platform-name">
                  {downloading === p ? 'Exporting…' : PLATFORM_LABELS[p]}
                </span>
                <span className="export-platform-size">{size.label} · {size.pixels}</span>
              </button>
            )
          })}
        </div>
        {exportError && (
          <div style={{ color: '#ff6b6b', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {exportError}
          </div>
        )}
        <div className="export-modal-footer">
          <button className="export-modal-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
