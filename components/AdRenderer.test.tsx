import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import AdRenderer from './AdRenderer'
import type { Variant } from '@/lib/types'

const baseVariant: Variant = {
  id: 'v1',
  layout: 'big-type-body',
  theme: 'dark',
  background: 'none',
  alignment: 'left',
  verticalAlign: 'top',
  reasoning: 'test',
  input: {
    adType: 'big-headline', headline: 'Code faster with AI',
    body: null, cta: 'Try free →', stat: null, statLabel: null, context: null
  }
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

  it('applies align-left class by default', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect((container.firstChild as HTMLElement).className).toContain('align-left')
  })

  it('applies align-center class when alignment is center', () => {
    const variant = { ...baseVariant, alignment: 'center' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('align-center')
  })

  it('applies valign-middle class when verticalAlign is middle', () => {
    const variant = { ...baseVariant, verticalAlign: 'middle' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('valign-middle')
  })

  it('renders stat-hero layout', () => {
    const variant = {
      ...baseVariant,
      layout: 'stat-hero' as const,
      input: { ...baseVariant.input, stat: '10%', statLabel: 'faster' } as typeof baseVariant.input
    }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.querySelector('.tpl-sh')).toBeTruthy()
  })

  it('renders customer-quote layout', () => {
    const variant = {
      ...baseVariant,
      layout: 'customer-quote' as const,
      alignment: 'left' as const,
      verticalAlign: 'middle' as const,
      input: {
        adType: 'quote' as const,
        quote: 'Augment cut our review time in half.',
        name: 'Sarah Chen',
        titleAndCompany: 'Staff Engineer · Vercel',
        cta: null,
        context: null
      }
    }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.querySelector('.tpl-cq')).toBeTruthy()
  })
})
