'use client'
import { useState } from 'react'
import type { Variant, Platform } from '@/lib/types'
import { PLATFORM_SIZES, PLATFORM_LABELS } from '@/lib/constants'
import { exportAdElement } from '@/lib/export'
import './PlatformExportBar.css'

interface Props {
  variants: Variant[]
  platforms: Platform[]
  adRefs: Map<string, HTMLDivElement>
}

export default function PlatformExportBar({ variants, platforms, adRefs }: Props) {
  const [downloading, setDownloading] = useState<Platform | null>(null)

  async function handleDownload(platform: Platform) {
    const size = PLATFORM_SIZES[platform]
    setDownloading(platform)
    for (const variant of variants) {
      const el = adRefs.get(variant.id)
      if (!el) continue
      const filename = `augment-${variant.id}-${variant.layout}-${variant.theme}-${platform}-${size.label.replace(':', 'x')}`
      await exportAdElement(el, size.width, size.height, filename)
      await new Promise(r => setTimeout(r, 200))
    }
    setDownloading(null)
  }

  return (
    <div className="peb">
      <div className="peb-label">Export — {variants.length} variants</div>
      <div className="peb-platforms">
        {platforms.map(p => {
          const size = PLATFORM_SIZES[p]
          return (
            <div key={p} className="peb-platform-card">
              <div className="peb-platform-name">{PLATFORM_LABELS[p]}</div>
              <div className="peb-size">
                <span className="peb-size-label">{size.label}</span>
                <span className="peb-size-pixels">{size.pixels}</span>
              </div>
              <button
                className="peb-download-btn"
                onClick={() => handleDownload(p)}
                disabled={downloading !== null}
              >
                {downloading === p ? 'Exporting…' : `↓ ${variants.length} files`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
