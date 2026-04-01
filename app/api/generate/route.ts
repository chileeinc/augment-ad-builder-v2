import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { LAYOUTS, THEMES, BACKGROUNDS } from '@/lib/types'
import type { GenerateRequest } from '@/lib/types'

const VisualTreatmentSchema = z.object({
  id: z.string(),
  layout: z.enum(LAYOUTS),
  theme: z.enum(THEMES),
  background: z.enum(BACKGROUNDS),
  reasoning: z.string()
})

const ResponseSchema = z.object({
  variants: z.array(VisualTreatmentSchema)
})

const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), 'docs/generation-guidelines.md'),
  'utf-8'
)

function buildUserMessage(req: GenerateRequest): string {
  const { input, platforms } = req
  const lines: string[] = [`Ad type: ${input.adType}`, `Platforms: ${platforms.join(', ')}`]

  if (input.adType === 'big-headline') {
    lines.push(`Headline: "${input.headline}"`)
    if (input.body) lines.push(`Body: "${input.body}"`)
    if (input.stat) lines.push(`Stat: ${input.stat} (${input.statLabel ?? ''})`)
    if (input.cta) lines.push(`CTA: "${input.cta}"`)
    if (input.context) lines.push(`Context: ${input.context}`)
  } else {
    lines.push(`Quote: "${input.quote}"`)
    if (input.name) lines.push(`Name: ${input.name}`)
    if (input.titleAndCompany) lines.push(`Title & Company: ${input.titleAndCompany}`)
    if (input.cta) lines.push(`CTA: "${input.cta}"`)
    if (input.context) lines.push(`Context: ${input.context}`)
  }

  return lines.join('\n')
}

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json()

    if (body.input.adType === 'big-headline' && !body.input.headline?.trim()) {
      return NextResponse.json({ error: 'headline is required' }, { status: 400 })
    }
    if (body.input.adType === 'quote' && !body.input.quote?.trim()) {
      return NextResponse.json({ error: 'quote is required' }, { status: 400 })
    }
    if (!body.platforms?.length) {
      return NextResponse.json({ error: 'at least one platform is required' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: ResponseSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserMessage(body)
    })

    // Merge visual treatments with input copy
    const variants = object.variants.map(v => ({ ...v, input: body.input }))
    return NextResponse.json({ variants })
  } catch (err) {
    console.error('[/api/generate]', err)
    return NextResponse.json({ error: 'generation failed' }, { status: 500 })
  }
}
