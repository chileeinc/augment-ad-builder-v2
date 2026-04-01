export type Theme = 'dark' | 'light' | 'tonal'
export type Background = 'none' | 'dot-grid' | 'grid'
export type Layout = 'big-type-body' | 'stat-hero' | 'customer-quote'
export type CopyAngle = 'metric-led' | 'benefit' | 'bold-claim' | 'brand-awareness'
export type Platform = 'linkedin' | 'twitter' | 'reddit' | 'google-display'

export interface Variant {
  id: string
  layout: Layout
  theme: Theme
  background: Background
  copy_angle: CopyAngle
  headline: string
  cta: string | null
  stat: string | null
  stat_label: string | null
  reasoning: string
}

export interface GenerateRequest {
  prompt: string
  platforms: Platform[]
}
