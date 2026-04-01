import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import type { GenerateRequest } from '@/lib/types'

const VariantSchema = z.object({
  id: z.string(),
  layout: z.enum(['big-type-body', 'stat-hero', 'customer-quote']),
  theme: z.enum(['dark', 'light', 'tonal']),
  background: z.enum(['none', 'dot-grid', 'grid']),
  copy_angle: z.enum(['metric-led', 'benefit', 'bold-claim', 'brand-awareness']),
  headline: z.string().max(80),
  cta: z.string().max(40).nullable(),
  stat: z.string().nullable(),
  stat_label: z.string().nullable(),
  reasoning: z.string()
})

const ResponseSchema = z.object({
  variants: z.array(VariantSchema)
})

const SYSTEM_PROMPT = `You are an expert ad designer for Augment Code, an AI coding assistant for developers.

Generate exactly 5 ad variants based on the user's prompt. Each variant must be distinct.

Rules:
- Cover at least 2 different themes across the 5 variants (dark, light, tonal)
- Cover at least 2 different layouts across the 5 variants
- Vary copy_angle across variants — do not repeat the same angle more than twice
- Headlines: punchy, ≤8 words, no filler ("discover", "unlock", "revolutionize")
- CTAs: short action phrase ≤5 words (e.g. "Try free →", "See benchmarks →", null if not needed)
- stat/stat_label: only when the prompt contains a specific metric (e.g. "10% faster" → stat="10%", stat_label="faster dev speed")
- stat is only meaningful with layout=stat-hero; use null for other layouts
- reasoning: one sentence explaining why this combination fits

Augment Code brand voice: technical, confident, precise. Ground claims in developer experience. Avoid generic AI hype.

Available layouts: big-type-body, stat-hero, customer-quote
Available themes: dark, light, tonal
Available backgrounds: none, dot-grid, grid
Available copy_angles: metric-led, benefit, bold-claim, brand-awareness

Assign ids: "v1" through "v5".`

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    if (!body.platforms?.length) {
      return NextResponse.json({ error: 'at least one platform is required' }, { status: 400 })
    }

    const userMessage = `Prompt: "${body.prompt}"\nTarget platforms: ${body.platforms.join(', ')}`

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: ResponseSchema,
      system: SYSTEM_PROMPT,
      prompt: userMessage
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error('[/api/generate]', err)
    return NextResponse.json({ error: 'generation failed' }, { status: 500 })
  }
}
