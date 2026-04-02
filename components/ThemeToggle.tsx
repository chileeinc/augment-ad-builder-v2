'use client'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <button
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '2px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        padding: '6px 12px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        transition: 'border-color 0.15s, color 0.15s',
        flexShrink: 0
      }}
    >
      {theme === 'dark' ? '☀ Light' : '◑ Dark'}
    </button>
  )
}
