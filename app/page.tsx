'use client'
import { useState } from 'react'
import type { Variant, Platform } from '@/lib/types'
import PromptInput from '@/components/PromptInput'
import VariantGrid from '@/components/VariantGrid'
import ExportModal from '@/components/ExportModal'
import './page.css'

interface ExportTarget {
  element: HTMLElement
  variant: Variant
}

export default function BuilderPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)

  async function handleGenerate(prompt: string, selectedPlatforms: Platform[]) {
    setLoading(true)
    setError(null)
    setPlatforms(selectedPlatforms)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platforms: selectedPlatforms })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }

      const data = await res.json()
      setVariants(data.variants)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="builder">
      <div className="builder-header">
        <div className="builder-title">Augment Ad Builder</div>
        <div className="builder-subtitle">Describe your ad. Get 5 variants.</div>
      </div>

      <PromptInput onGenerate={handleGenerate} loading={loading} />

      {error && (
        <div style={{ color: '#ff6b6b', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="builder-variants">
        <VariantGrid
          variants={variants}
          platforms={platforms}
          loading={loading}
          onExport={(el, v) => setExportTarget({ element: el, variant: v })}
        />
      </div>

      {exportTarget && (
        <ExportModal
          variant={exportTarget.variant}
          element={exportTarget.element}
          platforms={platforms}
          onClose={() => setExportTarget(null)}
        />
      )}
    </main>
  )
}
