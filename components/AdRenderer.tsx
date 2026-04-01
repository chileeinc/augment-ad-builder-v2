'use client'
import type { Variant } from '@/lib/types'
import BigTypeBody from '@/templates/BigTypeBody'
import StatHero from '@/templates/StatHero'
import CustomerQuote from '@/templates/CustomerQuote'
import '@/templates/templates.css'

interface Props {
  variant: Variant
  className?: string
  style?: React.CSSProperties
}

export default function AdRenderer({ variant, className, style }: Props) {
  const themeClass = `theme-${variant.theme}`
  const bgClass = variant.background !== 'none' ? `bg-${variant.background}` : ''
  const alignClass = `align-${variant.alignment}`
  const valignClass = `valign-${variant.verticalAlign}`
  const classes = ['ad-canvas', themeClass, bgClass, alignClass, valignClass, className]
    .filter(Boolean)
    .join(' ')

  const inner = (() => {
    switch (variant.layout) {
      case 'big-type-body':  return <BigTypeBody variant={variant} />
      case 'stat-hero':      return <StatHero variant={variant} />
      case 'customer-quote': return <CustomerQuote variant={variant} />
      default:               return null
    }
  })()

  return (
    <div className={classes} style={style}>
      {inner}
    </div>
  )
}
