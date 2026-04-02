'use client'
import { useState, useEffect, useRef } from 'react'
import type { Variant, AdInput, Platform } from '@/lib/types'
import { toLayout } from '@/lib/types'
import AdForm from '@/components/AdForm'
import VariantGrid from '@/components/VariantGrid'
import ExportModal from '@/components/ExportModal'
import ThemeToggle from '@/components/ThemeToggle'
import './page.css'

interface ExportTarget {
  element: HTMLElement
  variant: Variant
}

interface Generation {
  variants: Variant[]
  meta: { rounds: number; reviewed: number; passed: number } | null
}

function prefixVariants(variants: Variant[], genIdx: number): Variant[] {
  return variants.map(v => ({
    ...v,
    id: `g${genIdx}-${v.id}`,
    evaluation: v.evaluation ? { ...v.evaluation, id: `g${genIdx}-${v.id}` } : undefined,
  }))
}

/** Read an NDJSON stream, calling `onEvent` for each parsed line. */
async function readNdjsonStream(body: ReadableStream, onEvent: (event: Record<string, unknown>) => void) {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      onEvent(JSON.parse(line))
    }
  }
}

export default function BuilderPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)
  const [capturedImages, setCapturedImages] = useState<Map<string, string>>(new Map())
  const [visionEvaluating, setVisionEvaluating] = useState(false)
  // Tracks how many collision replacements each original slot has attempted.
  // Keyed by the original variantId (g1-v1). Capped at 2 to prevent infinite loops.
  const collisionAttemptsRef = useRef<Map<string, number>>(new Map())

  // Tracks how many generations have already been vision-evaluated
  const visionEvaluatedCountRef = useRef(0)
  // Stable generation counter — incremented before each generation starts
  const genCounterRef = useRef(0)

  async function handleGenerate(input: AdInput, selectedPlatforms: Platform[]) {
    setLoading(true)
    setError(null)
    setPlatforms(selectedPlatforms)
    setLoadingStatus('Starting…')

    const thisGenIdx = ++genCounterRef.current

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, platforms: selectedPlatforms })
      })

      if (!res.ok || !res.body) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }

      await readNdjsonStream(res.body, (event) => {
        if (event.type === 'status') setLoadingStatus(event.message as string)
        if (event.type === 'result') {
          const prefixed = prefixVariants(event.variants as Variant[], thisGenIdx)
          setGenerations(prev => [...prev, { variants: prefixed, meta: (event.meta as Generation['meta']) ?? null }])
        }
        if (event.type === 'error') throw new Error(event.message as string)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingStatus('')
    }
  }

  function handleImageReady(variantId: string, dataUrl: string) {
    setCapturedImages(prev => new Map(prev).set(variantId, dataUrl))
  }

  async function handleCollision(variantId: string) {
    // Derive the stable slot key: strip timestamp suffix from replacements
    // e.g. "g1-v2-r1234567" → "g1-v2", "g1-v2" → "g1-v2"
    const slotKey = variantId.replace(/-r\d+$/, '')
    const attempts = collisionAttemptsRef.current.get(slotKey) ?? 0
    if (attempts >= 2) return // give up after 2 replacement attempts per slot
    collisionAttemptsRef.current.set(slotKey, attempts + 1)

    try {
      // Find which generation owns this variant
      const ownerGen = generations.find(g => g.variants.some(v => v.id === variantId))
      if (!ownerGen) return

      const input = ownerGen.variants.find(v => v.id === variantId)?.input
      if (!input) return

      const accepted = ownerGen.variants
        .filter(v => v.id !== variantId)
        .map(toLayout)

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, platforms, accepted, count: 1 })
      })
      if (!res.ok || !res.body) return

      await readNdjsonStream(res.body, (event) => {
        if (event.type === 'result' && (event.variants as Variant[])?.[0]) {
          const raw = (event.variants as Variant[])[0]
          // Keep slotKey as the base so the 2-attempt cap tracks correctly
          // across the full replacement chain for the same slot.
          const replacementId = `${slotKey}-r${Date.now()}`
          const replacement: Variant = {
            ...raw,
            id: replacementId,
            input,
            evaluation: raw.evaluation
              ? { ...raw.evaluation, id: replacementId }
              : undefined,
          }
          setGenerations(prev => prev.map(g => ({
            ...g,
            variants: g.variants.map(v => v.id === variantId ? replacement : v),
          })))
          setCapturedImages(prev => { const m = new Map(prev); m.delete(variantId); return m })
        }
      })
    } catch (err) {
      console.error('[collision-replace]', err)
    }
  }

  // Vision eval: runs once for each new generation when all its images are captured
  useEffect(() => {
    const latestIdx = generations.length - 1
    if (latestIdx < 0) return
    if (latestIdx < visionEvaluatedCountRef.current) return
    if (visionEvaluating || loading) return

    const latest = generations[latestIdx]
    if (!latest || latest.variants.length === 0) return

    const allCaptured = latest.variants.every(v => capturedImages.has(v.id))
    if (!allCaptured) return

    visionEvaluatedCountRef.current = latestIdx + 1
    setVisionEvaluating(true)

    const layouts = latest.variants.map(toLayout)
    const images = latest.variants.map(v => capturedImages.get(v.id) ?? '')

    fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants: layouts, images }),
    })
      .then(r => r.json())
      .then(({ evaluations }) => {
        if (!evaluations) return
        setGenerations(prev => prev.map((g, i) => {
          if (i !== latestIdx) return g
          return {
            ...g,
            variants: g.variants.map(v => {
              const ev = evaluations.find((e: { id: string }) => e.id === v.id)
              return ev ? { ...v, evaluation: ev } : v
            }),
          }
        }))
      })
      .catch(err => console.error('[vision-eval]', err))
      .finally(() => setVisionEvaluating(false))
  }, [capturedImages.size, generations.length])

  return (
    <main className="builder">
      <div className="builder-header">
        <div className="builder-header-text">
          <div className="builder-title">Augment Ad Builder</div>
          <div className="builder-subtitle">Add your copy. Get 5 design variants.</div>
        </div>
        <ThemeToggle />
      </div>

      <AdForm onGenerate={handleGenerate} loading={loading} />

      {error && (
        <div style={{ color: '#ff6b6b', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Completed generations — oldest first */}
      {generations.map((gen, i) => (
        <div key={i} className="builder-variants">
          {gen.meta && (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.06em', padding: '8px 0' }}>
              {gen.meta.passed} passed · {gen.meta.reviewed} reviewed · {gen.meta.rounds} {gen.meta.rounds === 1 ? 'round' : 'rounds'}
            </div>
          )}
          <VariantGrid
            variants={gen.variants}
            loading={false}
            onExport={(el, variant) => setExportTarget({ element: el, variant })}
            onImageReady={handleImageReady}
            onCollision={handleCollision}
          />
        </div>
      ))}

      {/* Loading skeleton for in-progress generation */}
      {loading && (
        <div className="builder-variants">
          {loadingStatus && (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 0' }}>
              {loadingStatus}
            </div>
          )}
          <VariantGrid
            variants={[]}
            loading={true}
            onExport={() => {}}
          />
        </div>
      )}

      {visionEvaluating && (
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 0' }}>
          Panel reviewing renders…
        </div>
      )}

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
