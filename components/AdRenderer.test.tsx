import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import AdRenderer from './AdRenderer'
import type { Variant } from '@/lib/types'

const baseVariant: Variant = {
  id: 'v1',
  layout: 'big-type-body',
  theme: 'dark',
  background: 'none',
  copy_angle: 'benefit',
  headline: 'Code faster with AI',
  cta: 'Try free →',
  stat: null,
  stat_label: null,
  reasoning: 'test'
}

describe('AdRenderer', () => {
  it('renders without crashing for big-type-body', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('applies theme-dark class', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect((container.firstChild as HTMLElement).className).toContain('theme-dark')
  })

  it('applies theme-tonal class when theme is tonal', () => {
    const variant = { ...baseVariant, theme: 'tonal' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('theme-tonal')
  })

  it('applies bg-dot-grid class when background is dot-grid', () => {
    const variant = { ...baseVariant, background: 'dot-grid' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('bg-dot-grid')
  })

  it('does not apply bg class when background is none', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect((container.firstChild as HTMLElement).className).not.toContain('bg-')
  })

  it('renders stat-hero layout', () => {
    const variant = { ...baseVariant, layout: 'stat-hero' as const, stat: '10%', stat_label: 'faster' }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.querySelector('.tpl-sh')).toBeTruthy()
  })

  it('renders customer-quote layout', () => {
    const variant = { ...baseVariant, layout: 'customer-quote' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.querySelector('.tpl-cq')).toBeTruthy()
  })
})
