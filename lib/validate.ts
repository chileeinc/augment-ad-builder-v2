import type { GeneratedLayout } from '@/lib/types'

const CANVAS = 1080

function parsePx(val: string): number | undefined {
  const m = val.match(/^-?(\d+(?:\.\d+)?)px$/)
  return m ? parseFloat(m[1]) : undefined
}

function parseProps(css: string): Record<string, string> {
  const props: Record<string, string> = {}
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1) continue
    const k = decl.slice(0, i).trim()
    const v = decl.slice(i + 1).trim()
    if (k && v) props[k] = v
  }
  return props
}

export function validateVariant(v: GeneratedLayout): string[] {
  const errors: string[] = []

  if (!v.logo?.trim()) errors.push('logo missing')
  if (!v.headline?.trim()) errors.push('headline missing')

  const slots = [
    ['logo', v.logo],
    ['headline', v.headline],
    ['body', v.body],
    ['eyebrow', v.eyebrow],
    ['cta', v.cta],
  ] as const

  for (const [name, css] of slots) {
    if (!css?.trim()) continue
    const p = parseProps(css)

    const top      = parsePx(p.top ?? '')
    const left     = parsePx(p.left ?? '')
    const right    = parsePx(p.right ?? '')
    const bottom   = parsePx(p.bottom ?? '')
    const fontSize = parsePx(p['font-size'] ?? '')
    const maxWidth = parsePx(p['max-width'] ?? '')
    const width    = parsePx(p.width ?? '')

    if (top    !== undefined && top    > CANVAS) errors.push(`${name}: top ${top}px outside canvas`)
    if (left   !== undefined && left   > CANVAS) errors.push(`${name}: left ${left}px outside canvas`)
    if (right  !== undefined && right  > CANVAS) errors.push(`${name}: right ${right}px outside canvas`)
    if (bottom !== undefined && bottom > CANVAS) errors.push(`${name}: bottom ${bottom}px outside canvas`)

    if (left !== undefined && maxWidth !== undefined && left + maxWidth > CANVAS)
      errors.push(`${name}: left(${left}) + max-width(${maxWidth}) = ${left + maxWidth} overflows canvas`)
    if (left !== undefined && width !== undefined && left + width > CANVAS)
      errors.push(`${name}: left(${left}) + width(${width}) = ${left + width} overflows canvas`)

    if (fontSize !== undefined) {
      if ((name === 'body' || name === 'cta') && fontSize < 30)
        errors.push(`${name}: font-size ${fontSize}px below 30px minimum`)
      if (fontSize > CANVAS * 0.65)
        errors.push(`${name}: font-size ${fontSize}px implausibly large for canvas`)
    }

    if (name === 'logo' && width !== undefined && width < 300)
      errors.push(`logo: width ${width}px below 300px minimum`)
  }

  return errors
}
