'use client'
import { useState, useRef, useCallback } from 'react'
import type { Variant, Platform } from '@/lib/types'
import PromptInput from '@/components/PromptInput'
import VariantGrid from '@/components/VariantGrid'
import PlatformExportBar from '@/components/PlatformExportBar'
import './page.css'

export default function BuilderPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const adRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) adRefs.current.set(id, el)
    else adRefs.current.delete(id)
  }, [])

  async function handleGenerate(prompt: string, selectedPlatforms: Platform[]) {
    setLoading(true)
    setError(null)
    setPlatforms(selectedPlatforms)
    adRefs.current.clear()

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
        <VariantGrid variants={variants} loading={loading} registerRef={registerRef} />
      </div>

      {variants.length > 0 && (
        <PlatformExportBar variants={variants} platforms={platforms} adRefs={adRefs.current} />
      )}
    </main>
  )
}
