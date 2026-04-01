import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the AI SDK before importing route
vi.mock('ai', () => ({
  generateObject: vi.fn()
}))
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model')
}))

import { POST } from './route'
import { generateObject } from 'ai'

const mockVariants = Array.from({ length: 5 }, (_, i) => ({
  id: `v${i + 1}`,
  layout: 'big-type-body',
  theme: 'dark',
  background: 'none',
  reasoning: 'test reasoning'
}))

const validBigHeadlineInput = {
  adType: 'big-headline',
  headline: 'Test headline',
  body: null,
  cta: null,
  stat: null,
  statLabel: null,
  context: null
}

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockResolvedValue({ object: { variants: mockVariants } } as never)
  })

  it('returns 400 when headline is missing', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        input: { adType: 'big-headline', headline: '', body: null, cta: null, stat: null, statLabel: null, context: null },
        platforms: ['linkedin']
      })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when platforms is empty', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ input: validBigHeadlineInput, platforms: [] })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with 5 variants on valid input', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ input: validBigHeadlineInput, platforms: ['linkedin'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.variants).toHaveLength(5)
  })

  it('each variant has required fields', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ input: validBigHeadlineInput, platforms: ['linkedin'] })
    })
    const res = await POST(req)
    const data = await res.json()
    for (const v of data.variants) {
      expect(v.id).toBeTruthy()
      expect(v.layout).toBeTruthy()
      expect(v.theme).toBeTruthy()
    }
  })

  it('each variant includes the input copy', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ input: validBigHeadlineInput, platforms: ['linkedin'] })
    })
    const res = await POST(req)
    const data = await res.json()
    for (const v of data.variants) {
      expect(v.input).toEqual(validBigHeadlineInput)
    }
  })

  it('returns 400 when quote is missing for quote ad type', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        input: { adType: 'quote', quote: '', name: null, titleAndCompany: null, cta: null, context: null },
        platforms: ['linkedin']
      })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
