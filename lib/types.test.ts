import { describe, it, expect } from 'vitest'
import { PLATFORM_SIZES } from './constants'
import type { Variant, Platform } from './types'

describe('PLATFORM_SIZES', () => {
  it('has an entry for every platform', () => {
    const platforms: Platform[] = ['linkedin', 'twitter', 'reddit', 'google-display']
    for (const p of platforms) {
      expect(PLATFORM_SIZES[p]).toBeDefined()
    }
  })

  it('each size has positive width and height', () => {
    for (const size of Object.values(PLATFORM_SIZES)) {
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
      expect(size.label).toBeTruthy()
    }
  })
})

describe('Variant shape', () => {
  it('accepts a valid big-headline variant object', () => {
    const v: Variant = {
      id: 'v1',
      layout: 'stat-hero',
      theme: 'dark',
      background: 'dot-grid',
      alignment: 'left',
      verticalAlign: 'top',
      reasoning: 'Stat-led for LinkedIn feed impact',
      input: {
        adType: 'big-headline',
        headline: '10% faster. Every dev.',
        body: null,
        cta: 'Try free →',
        stat: '10%',
        statLabel: 'faster dev speed',
        context: null
      }
    }
    expect(v.id).toBe('v1')
  })

  it('accepts a valid quote variant object', () => {
    const v: Variant = {
      id: 'v2',
      layout: 'customer-quote',
      theme: 'tonal',
      background: 'none',
      alignment: 'center',
      verticalAlign: 'middle',
      reasoning: 'Social proof for awareness campaign',
      input: {
        adType: 'quote',
        quote: 'Augment cut our review time in half.',
        name: 'Sarah Chen',
        titleAndCompany: 'Staff Engineer · Vercel',
        cta: 'Read the story →',
        context: null
      }
    }
    expect(v.id).toBe('v2')
  })
})
