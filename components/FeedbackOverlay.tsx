'use client'
import { useState } from 'react'
import './FeedbackOverlay.css'

const NEGATIVE_TAGS = ['Too Crowded', 'Weak Hierarchy', 'Text Cut Off']
const POSITIVE_TAGS = ['Strong Hierarchy', 'Clean Layout', 'Striking Composition']

export interface FeedbackState {
  vote: 'up' | 'down'
  tags: string[]
  note: string
}

interface Props {
  variantId: string
  sessionId: string | null
  initialFeedback?: FeedbackState | null
}

export default function FeedbackOverlay({ variantId, sessionId, initialFeedback }: Props) {
  const [vote, setVote]         = useState<'up' | 'down' | null>(initialFeedback?.vote ?? null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [tags, setTags]         = useState<string[]>(initialFeedback?.tags ?? [])
  const [note, setNote]         = useState(initialFeedback?.note ?? '')
  const [saving, setSaving]     = useState(false)

  const tags_to_show = vote === 'up' ? POSITIVE_TAGS : NEGATIVE_TAGS

  function openPanel(direction: 'up' | 'down') {
    // Same thumb while panel is open → close
    if (vote === direction && panelOpen) { setPanelOpen(false); return }
    // Same thumb while panel is closed → reopen showing existing feedback, no save
    if (vote === direction) { setPanelOpen(true); return }
    // Different thumb → new vote, clear previous feedback, save immediately
    setVote(direction)
    setTags([])
    setNote('')
    setPanelOpen(true)
    saveFeedback(direction, [], '')
  }

  function toggleTag(tag: string) {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    setTags(next)
    if (vote) saveFeedback(vote, next, note)
  }

  function handleNoteBlur() {
    if (vote) saveFeedback(vote, tags, note)
  }

  function handleDone() {
    setPanelOpen(false)
  }

  async function saveFeedback(v: 'up' | 'down', t: string[], n: string) {
    if (!sessionId) return
    setSaving(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, variantId, vote: v, tags: t, note: n }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[feedback] save failed', res.status, body)
      }
    } catch (e) {
      console.error('[feedback]', e)
    } finally {
      setSaving(false)
    }
  }

  const canVote = !!sessionId

  return (
    <>
      {/* Thumbs — top-right corner, show on parent hover via CSS */}
      <div className="fb-thumbs">
        <button
          className={`fb-thumb up${vote === 'up' ? ' active' : ''}`}
          onClick={() => canVote && openPanel('up')}
          title={canVote ? 'Good' : 'Saving…'}
          style={{ opacity: canVote ? 1 : 0.35, cursor: canVote ? 'pointer' : 'default' }}
        >👍</button>
        <button
          className={`fb-thumb down${vote === 'down' ? ' active' : ''}`}
          onClick={() => canVote && openPanel('down')}
          title={canVote ? 'Not this' : 'Saving…'}
          style={{ opacity: canVote ? 1 : 0.35, cursor: canVote ? 'pointer' : 'default' }}
        >👎</button>
      </div>

      {/* Feedback panel — overlays the ad */}
      {panelOpen && vote && (
        <div className={`fb-panel fb-panel-${vote}`}>
          <div className={`fb-panel-header fb-header-${vote}`}>
            {vote === 'up' ? '👍 What worked?' : '👎 What\'s wrong?'}
            {saving && <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 9 }}>saving…</span>}
          </div>
          <div className="fb-tags">
            {tags_to_show.map(tag => (
              <button
                key={tag}
                className={`fb-tag${tags.includes(tag) ? ` fb-tag-active-${vote}` : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <textarea
            className="fb-note"
            placeholder={vote === 'up' ? 'What should the AI do more of?' : 'What should the AI avoid?'}
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={handleNoteBlur}
          />
          <button className="fb-done" onClick={handleDone}>Done</button>
        </div>
      )}

      {/* Voted badge — bottom-left, shown when panel is closed and voted */}
      {vote && !panelOpen && (
        <div className={`fb-badge fb-badge-${vote}`}>
          {vote === 'up' ? '👍 Liked' : '👎 Disliked'}
        </div>
      )}
    </>
  )
}
