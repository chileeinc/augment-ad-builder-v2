import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import AdRenderer from './AdRenderer'
import type { Variant } from '@/lib/types'

const baseVariant: Variant = {
  id: 'v1',
  concept: 'Gravity Pull',
  theme: 'dark',
  background: 'none',
  reasoning: 'test',
  logo: 'position:absolute;top:32px;right:32px;width:100px',
  headline: 'position:absolute;bottom:72px;left:32px;font-size:72px;font-weight:300;letter-spacing:-1px;max-width:380px',
  body: '',
  eyebrow: '',
  cta: 'position:absolute;bottom:32px;left:32px;font-size:13px;text-transform:uppercase;color:#1AA049',
  input: {
    adType: 'big-headline', headline: 'Code faster with AI',
    body: null, cta: 'Try free →', stat: null, statLabel: null, context: null
  }
}

describe('AdRenderer', () => {
  it('renders without crashing', () => {
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
    const variant = { ...baseVariant, background: 'dot-grid' }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('bg-dot-grid')
  })

  it('does not apply bg class when background is none', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect((container.firstChild as HTMLElement).className).not.toContain('bg-')
  })

  it('renders headline copy', () => {
    const { getByText } = render(<AdRenderer variant={baseVariant} />)
    expect(getByText('Code faster with AI')).toBeTruthy()
  })

  it('renders with quote input', () => {
    const variant: Variant = {
      ...baseVariant,
      input: {
        adType: 'quote',
        quote: 'Augment cut our review time in half.',
        name: 'Sarah Chen',
        titleAndCompany: 'Staff Engineer · Vercel',
        cta: null,
        context: null
      }
    }
    const { getByText } = render(<AdRenderer variant={variant} />)
    expect(getByText('Augment cut our review time in half.')).toBeTruthy()
  })

  it('renders custom CSS background', () => {
    const variant = { ...baseVariant, background: 'linear-gradient(#002400, #004B07)' }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('omits body element when body string is empty', () => {
    const { queryByText } = render(<AdRenderer variant={baseVariant} />)
    expect(queryByText('null')).toBeNull()
  })
})
