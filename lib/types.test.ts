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
  it('accepts a valid variant object', () => {
    const v: Variant = {
      id: 'v1',
      layout: 'stat-hero',
      theme: 'dark',
      background: 'dot-grid',
      copy_angle: 'metric-led',
      headline: '10% faster. Every dev.',
      cta: 'Try free →',
      stat: '10%',
      stat_label: 'faster dev speed',
      reasoning: 'Stat-led for LinkedIn feed impact'
    }
    expect(v.id).toBe('v1')
  })
})
