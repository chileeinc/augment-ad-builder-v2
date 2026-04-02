import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { CoreUserMessage } from 'ai'
import type { GeneratedLayout, VariantEvaluation, JudgeResult } from '@/lib/types'

const CRITERIA = readFileSync(
  join(process.cwd(), 'docs/acceptance-criteria.md'),
  'utf-8'
)

type JudgeRole = 'designer' | 'taste_maker' | 'growth_hacker'

const JUDGE_LABELS: Record<JudgeRole, string> = {
  designer:      'The Designer',
  taste_maker:   'The Taste Maker',
  growth_hacker: 'The Growth Hacker',
}

// Per-judge response schema — one judge evaluates all variants
const JudgeEvalSchema = z.object({
  id:        z.string(),
  auto_fail: z.boolean(),
  s1:        z.number(),
  s2:        z.number(),
  s3:        z.number(),
  s4:        z.number(),
  overall:   z.number(),
  pass:      z.boolean(),
  note:      z.string(),
})

const JudgeResponseSchema = z.object({
  evaluations: z.array(JudgeEvalSchema)
})

function describeVariant(v: GeneratedLayout): string {
  return [
    `Variant ${v.id} — "${v.concept}"`,
    `Theme: ${v.theme} | Background: ${v.background}`,
    `Logo: ${v.logo || '[omitted]'}`,
    `Headline: ${v.headline || '[omitted]'}`,
    `Body: ${v.body || '[omitted]'}`,
    `Eyebrow: ${v.eyebrow || '[omitted]'}`,
    `CTA: ${v.cta || '[omitted]'}`,
  ].join('\n')
}

async function evaluateAsJudge(
  variants: GeneratedLayout[],
  role: JudgeRole,
  images?: string[]
): Promise<z.infer<typeof JudgeEvalSchema>[]> {
  const hasImages = images && images.length > 0

  if (hasImages) {
    const content: CoreUserMessage['content'] = [
      {
        type: 'text',
        text: `You are acting exclusively as ${JUDGE_LABELS[role]}. Score each variant from your specific perspective. You can see the rendered ad image for each variant.`,
      },
    ]

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      content.push({ type: 'text', text: `--- Variant ${v.id} — "${v.concept}" | ${v.theme} ---` })
      content.push(images[i]
        ? { type: 'image', image: images[i] }
        : { type: 'text', text: describeVariant(v) }
      )
    }

    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: JudgeResponseSchema,
      system: CRITERIA,
      messages: [{ role: 'user', content }],
    })
    return object.evaluations
  }

  const prompt = [
    `You are acting exclusively as ${JUDGE_LABELS[role]}. Score only from your specific perspective as described in the criteria. Do not consider other judges' dimensions.`,
    '',
    'Variants to evaluate:',
    '',
    ...variants.map(describeVariant),
  ].join('\n\n')

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: JudgeResponseSchema,
    system: CRITERIA,
    prompt,
  })
  return object.evaluations
}

// P4-C: code enforces the threshold math; AI's pass boolean is a veto
function judgePass(j: JudgeResult, passThreshold: number): boolean {
  const avg = (j.s1 + j.s2 + j.s3 + j.s4) / 4
  return avg >= passThreshold && j.pass
}

function toJudgeResult(e: z.infer<typeof JudgeEvalSchema>): JudgeResult {
  return { s1: e.s1, s2: e.s2, s3: e.s3, s4: e.s4, overall: e.overall, pass: e.pass, note: e.note }
}

const FALLBACK_JUDGE: JudgeResult = {
  s1: 0, s2: 0, s3: 0, s4: 0, overall: 0, pass: false, note: 'not evaluated'
}

export async function evaluateVariants(
  variants: GeneratedLayout[],
  passThreshold: number = 6.5,
  images?: string[]
): Promise<VariantEvaluation[]> {
  const [designerEvals, tasteMakerEvals, growthEvals] = await Promise.all([
    evaluateAsJudge(variants, 'designer', images),
    evaluateAsJudge(variants, 'taste_maker', images),
    evaluateAsJudge(variants, 'growth_hacker', images),
  ])

  const dMap = new Map(designerEvals.map(e => [e.id, e]))
  const tMap = new Map(tasteMakerEvals.map(e => [e.id, e]))
  const gMap = new Map(growthEvals.map(e => [e.id, e]))

  return variants.map(v => {
    const d = dMap.get(v.id)
    const t = tMap.get(v.id)
    const g = gMap.get(v.id)

    const auto_fail   = (d?.auto_fail || t?.auto_fail || g?.auto_fail) ?? false
    const designer    = d ? toJudgeResult(d) : FALLBACK_JUDGE
    const taste_maker = t ? toJudgeResult(t) : FALLBACK_JUDGE
    const growth_hacker = g ? toJudgeResult(g) : FALLBACK_JUDGE

    const final = (designer.overall + taste_maker.overall + growth_hacker.overall) / 3
    const passingJudges = [designer, taste_maker, growth_hacker].filter(j => judgePass(j, passThreshold)).length
    const pass = !auto_fail && passingJudges >= 2

    return { id: v.id, auto_fail, designer, taste_maker, growth_hacker, final, pass }
  })
}
