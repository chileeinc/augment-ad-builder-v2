'use client'
import { useState } from 'react'
import type { Platform } from '@/lib/types'
import { PLATFORM_LABELS } from '@/lib/constants'
import './PromptInput.css'

interface Props {
  onGenerate: (prompt: string, platforms: Platform[]) => void
  loading: boolean
}

const ALL_PLATFORMS: Platform[] = ['linkedin', 'twitter', 'reddit', 'google-display']

export default function PromptInput({ onGenerate, loading }: Props) {
  const [prompt, setPrompt] = useState('')
  const [selected, setSelected] = useState<Platform[]>(['linkedin'])

  function togglePlatform(p: Platform) {
    setSelected(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || selected.length === 0 || loading) return
    onGenerate(prompt.trim(), selected)
  }

  return (
    <form className="prompt-input" onSubmit={handleSubmit}>
      <textarea
        className="prompt-textarea"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe your ad… e.g. Augment makes devs 10% faster at code review"
        rows={3}
      />
      <div>
        <div className="platforms-label">Platforms</div>
        <div className="platforms-grid">
          {ALL_PLATFORMS.map(p => (
            <button
              key={p}
              type="button"
              className={`platform-chip${selected.includes(p) ? ' selected' : ''}`}
              onClick={() => togglePlatform(p)}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <button
        className="generate-btn"
        type="submit"
        disabled={!prompt.trim() || selected.length === 0 || loading}
      >
        {loading ? 'Generating…' : 'Generate 5 variants →'}
      </button>
    </form>
  )
}
