'use client'
import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'

const FONT_INTER = "var(--font-inter), Inter, system-ui, sans-serif"
const FONT_MONO  = "var(--font-mono), 'Source Code Pro', monospace"

function normalizeFontFamily(val: string): string {
  const v = val.toLowerCase()
  if (v.includes('mono') || v.includes('source code') || v.includes('courier') || v.includes('code')) return FONT_MONO
  return FONT_INTER
}

function parseStyle(css: string): React.CSSProperties {
  if (!css.trim()) return {}
  const style: Record<string, string> = {}
  css.split(';').forEach(decl => {
    const colon = decl.indexOf(':')
    if (colon === -1) return
    const prop = decl.slice(0, colon).trim()
    const val  = decl.slice(colon + 1).trim()
    if (!prop || !val) return
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    style[camel] = camel === 'fontFamily' ? normalizeFontFamily(val) : val
  })
  return style as React.CSSProperties
}

interface Props { variant: Variant }

export default function FreeformCanvas({ variant }: Props) {
  const { input, logo, headline, body, eyebrow, cta } = variant

  // Resolve copy
  const headlineCopy = input.adType === 'big-headline' ? input.headline : input.quote
  const ctaCopy      = input.cta ?? null
  const eyebrowCopy  = input.adType === 'big-headline' && input.stat && input.statLabel
    ? `${input.stat} — ${input.statLabel}`
    : null
  const bodyCopy     = input.adType === 'big-headline' ? input.body : null

  // For quote ads, attribution uses whichever slot the LLM chose (eyebrow preferred, body fallback)
  // Typography is always forced to mono label — position/placement comes from the LLM slot CSS
  const attrSlotCss  = input.adType === 'quote' ? (eyebrow || body || null) : null
  const MONO_LABEL: React.CSSProperties = {
    fontFamily: "var(--font-mono), 'Source Code Pro', monospace",
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: '4px',
    lineHeight: '1.6',
  }

  // Extract logo width from its style string for sizing the wrapper
  const logoStyle   = parseStyle(logo)
  const logoWidth   = logoStyle.width ?? '100px'
  const logoColor   = logoStyle.color as string | undefined

  // Build wrapper style without width/color (those are handled separately)
  const { width: _w, color: _c, ...logoWrapperStyle } = logoStyle

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Logo */}
      {logo && (
        <div data-slot="logo" style={{ ...logoWrapperStyle, width: logoWidth }}>
          <AugmentLogo color={logoColor ?? 'currentColor'} />
        </div>
      )}

      {/* Eyebrow — big-headline only */}
      {eyebrow && eyebrowCopy && (
        <div data-slot="eyebrow" style={parseStyle(eyebrow)}>{eyebrowCopy}</div>
      )}

      {/* Headline */}
      {headline && (
        <div data-slot="headline" style={parseStyle(headline)}>{headlineCopy}</div>
      )}

      {/* Body — big-headline only */}
      {body && bodyCopy && (
        <div data-slot="body" style={parseStyle(body)}>{bodyCopy}</div>
      )}

      {/* Attribution — quote ads only, always mono label, name / title+company on separate lines */}
      {attrSlotCss && input.adType === 'quote' && (input.name || input.titleAndCompany) && (
        <div data-slot="attribution" style={{ ...parseStyle(attrSlotCss), ...MONO_LABEL }}>
          {input.name && <span style={{ display: 'block' }}>{input.name}</span>}
          {input.titleAndCompany && <span style={{ display: 'block' }}>{input.titleAndCompany}</span>}
        </div>
      )}

      {/* CTA */}
      {cta && ctaCopy && (
        <div data-slot="cta" style={parseStyle(cta)}>{ctaCopy}</div>
      )}

    </div>
  )
}
