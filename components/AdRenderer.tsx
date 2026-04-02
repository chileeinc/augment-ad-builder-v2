'use client'
import { forwardRef } from 'react'
import type { Variant } from '@/lib/types'
import FreeformCanvas from '@/components/FreeformCanvas'
import '@/app/templates.css'

const PRESET_BACKGROUNDS = ['none', 'dot-grid', 'grid']

interface Props {
  variant: Variant
  className?: string
  style?: React.CSSProperties
}

const AdRenderer = forwardRef<HTMLDivElement, Props>(function AdRenderer(
  { variant, className, style },
  ref
) {
  const isPreset = PRESET_BACKGROUNDS.includes(variant.background)
  const bgClass = isPreset && variant.background !== 'none' ? `bg-${variant.background}` : ''
  const bgStyle = !isPreset ? { background: variant.background } : {}

  const classes = ['ad-canvas', `theme-${variant.theme}`, bgClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={classes} style={{ ...bgStyle, ...style }}>
      <FreeformCanvas variant={variant} />
    </div>
  )
})

export default AdRenderer
