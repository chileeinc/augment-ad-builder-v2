'use client'
import { useState, useEffect } from 'react'
import type { Variant, Platform } from '@/lib/types'
import VariantGrid from '@/components/VariantGrid'
import ExportModal from '@/components/ExportModal'
import type { FeedbackState } from '@/components/FeedbackOverlay'

interface Session {
  id: string
  created_at: string
  ad_type: string
  platform_selection: string[]
  variants: Variant[]
  feedbackMap: Record<string, FeedbackState>
}

interface ExportTarget { element: HTMLElement; variant: Variant }

interface HistoryPanelProps {
  open: boolean
  onClose: () => void
}

export default function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)
  const [exportPlatforms, setExportPlatforms] = useState<Platform[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/sessions')
      .then(r => r.json())
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open])

  async function handleDelete(id: string) {
    if (!confirm('Delete this session and all its variants?')) return
    setDeletingId(id)
    await fetch(`/api/delete-session?id=${id}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.6)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: '100%', maxWidth: 1440,
        background: 'var(--bg, #0a0a0b)',
        borderLeft: '1px solid var(--border, #2a2a35)',
        overflowY: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        padding: '32px 32px 64px',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Session History
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
          >
            ✕ Close
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '64px 0' }}>
            Loading…
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-hint)', padding: '64px 0' }}>
            No sessions yet. Generate some ads to get started.
          </div>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {sessions.map(s => {
              const date = new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
              const time = new Date(s.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={s.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {s.ad_type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-hint)' }}>
                        {s.platform_selection.join(' · ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-hint)' }}>
                        {date} · {time}
                      </span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-hint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em', opacity: deletingId === s.id ? 0.4 : 1 }}
                      >
                        {deletingId === s.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  {s.variants.length > 0 ? (
                    <VariantGrid
                      variants={s.variants}
                      loading={false}
                      sessionId={s.id}
                      feedbackMap={s.feedbackMap}
                      onExport={(el, variant) => {
                        setExportTarget({ element: el, variant })
                        setExportPlatforms(s.platform_selection as Platform[])
                      }}
                    />
                  ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-hint)', padding: '20px 0' }}>
                      No variants saved
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {exportTarget && (
        <ExportModal
          variant={exportTarget.variant}
          element={exportTarget.element}
          platforms={exportPlatforms}
          onClose={() => setExportTarget(null)}
        />
      )}
    </>
  )
}
