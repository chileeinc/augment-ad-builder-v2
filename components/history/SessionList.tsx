'use client'
import { useState } from 'react'
import type { SessionWithVariants } from '@/app/history/page'
import VariantGrid from '@/components/VariantGrid'
import ExportModal from '@/components/ExportModal'
import type { Variant, Platform } from '@/lib/types'

interface ExportTarget { element: HTMLElement; variant: Variant }

interface SessionListProps {
  sessions: SessionWithVariants[]
}

export default function SessionList({ sessions: initial }: SessionListProps) {
  const [sessions, setSessions] = useState(initial)
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)
  const [exportPlatforms, setExportPlatforms] = useState<Platform[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this session and all its variants?')) return
    setDeletingId(id)
    await fetch(`/api/delete-session?id=${id}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted, #888)', padding: '64px 0', fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}>
        No sessions yet. Generate some ads to get started.
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {sessions.map(s => {
          const date = new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
          const time = new Date(s.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={s.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--text-muted, #888)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {s.ad_type}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--text-hint, #666)' }}>
                    {s.platform_selection.join(' · ')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--text-hint, #666)' }}>
                    {date} · {time}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--text-hint, #666)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em', opacity: deletingId === s.id ? 0.4 : 1 }}
                  >
                    {deletingId === s.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              {s.variants.length > 0 ? (
                <VariantGrid
                  variants={s.variants}
                  loading={false}
                  onExport={(el, variant) => {
                    setExportTarget({ element: el, variant })
                    setExportPlatforms(s.platform_selection as Platform[])
                  }}
                />
              ) : (
                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--text-hint, #666)' }}>
                  No variants saved
                </div>
              )}
            </div>
          )
        })}
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
