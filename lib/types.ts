export const LAYOUTS = ['big-type-body', 'stat-hero', 'customer-quote'] as const
export const THEMES = ['dark', 'light', 'tonal'] as const
export const BACKGROUNDS = ['none', 'dot-grid', 'grid'] as const

export type Layout = typeof LAYOUTS[number]
export type Theme = typeof THEMES[number]
export type Background = typeof BACKGROUNDS[number]
export type Platform = 'linkedin' | 'twitter' | 'reddit' | 'google-display'
export type AdType = 'big-headline' | 'quote'

export interface BigHeadlineInput {
  adType: 'big-headline'
  headline: string
  body: string | null
  cta: string | null
  stat: string | null
  statLabel: string | null
  context: string | null
}

export interface QuoteInput {
  adType: 'quote'
  quote: string
  name: string | null
  titleAndCompany: string | null
  cta: string | null
  context: string | null
}

export type AdInput = BigHeadlineInput | QuoteInput

// Claude only returns visual treatment — copy comes from AdInput
export interface VisualTreatment {
  id: string
  layout: Layout
  theme: Theme
  background: Background
  reasoning: string
}

// Full variant = visual treatment + copy merged at render time
export interface Variant extends VisualTreatment {
  input: AdInput
}

export interface GenerateRequest {
  input: AdInput
  platforms: Platform[]
}
