export const THEMES = ['dark', 'light', 'tonal'] as const
export type Theme = typeof THEMES[number]
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
  name: string
  titleAndCompany: string
  cta: string | null
  context: string | null
}

export type AdInput = BigHeadlineInput | QuoteInput

// What the AI outputs — each element is a CSS inline style string.
// e.g. "position:absolute;top:32px;left:32px;font-size:72px;font-weight:300"
// Empty string = element not shown.
export interface GeneratedLayout {
  id: string
  concept: string     // evocative name, e.g. "Gravity Pull"
  theme: Theme
  background: string  // 'none' | 'dot-grid' | 'grid' | any valid CSS background value
  reasoning: string
  logo: string
  headline: string
  body: string
  eyebrow: string
  cta: string
}

// Full variant = generated layout + copy merged at render time
export interface Variant extends GeneratedLayout {
  input: AdInput
  evaluation?: VariantEvaluation
}

export interface GenerateRequest {
  input: AdInput
  platforms: Platform[]
  accepted?: GeneratedLayout[]
  count?: number
}

// Evaluation types
export interface JudgeResult {
  s1: number
  s2: number
  s3: number
  s4: number
  overall: number
  pass: boolean
  note: string
}

export interface VariantEvaluation {
  id: string
  auto_fail: boolean
  designer: JudgeResult
  taste_maker: JudgeResult
  growth_hacker: JudgeResult
  final: number
  pass: boolean
}

export interface GenerateMeta {
  rounds: number
  reviewed: number
  passed: number
}

/** Strip runtime-only fields from a Variant, returning just the GeneratedLayout. */
export function toLayout({ input: _i, evaluation: _e, ...layout }: Variant): GeneratedLayout {
  return layout
}
