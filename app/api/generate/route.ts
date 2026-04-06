import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { THEMES } from '@/lib/types'
import { validateVariant } from '@/lib/validate'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { GenerateRequest, GeneratedLayout } from '@/lib/types'

const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), 'docs/generation-guidelines.md'),
  'utf-8'
)

const TAG_DIRECTIVES: Record<string, string> = {
  'Too Crowded':          'Increase whitespace between slots, shrink secondary element font sizes, spread elements further apart — all user-provided fields must still appear.',
  'Weak Hierarchy':       'Exaggerate size contrast — headline should dominate strongly, secondary elements much smaller.',
  'Text Cut Off':         'Keep all slots well within canvas bounds, generous edge padding, no slot should overlap another.',
  'Strong Hierarchy':     'A large dominant headline with much smaller secondary elements is working well — preserve this pattern.',
  'Clean Layout':         'Generous spacing and few competing elements are resonating — keep layouts open.',
  'Striking Composition': 'Unconventional or asymmetric layouts are getting positive responses — explore similar placements.',
}

async function buildFeedbackContext(): Promise<string> {
  try {
    const supabase = getSupabaseAdmin()

    // Top 5 liked variants
    const { data: liked } = await supabase
      .from('feedback')
      .select('variant_id, tags, note, variants(variant_data)')
      .eq('vote', 'up')
      .order('created_at', { ascending: false })
      .limit(5)

    // Top 3 disliked variants
    const { data: disliked } = await supabase
      .from('feedback')
      .select('variant_id, tags, note, variants(variant_data)')
      .eq('vote', 'down')
      .order('created_at', { ascending: false })
      .limit(3)

    // Tag vote counts
    const { data: allFeedback } = await supabase
      .from('feedback')
      .select('vote, tags')

    // Last 5 non-empty notes
    const { data: notes } = await supabase
      .from('feedback')
      .select('note, vote')
      .not('note', 'is', null)
      .neq('note', '')
      .order('created_at', { ascending: false })
      .limit(5)

    const lines: string[] = []

    // Positive few-shot examples
    if (liked?.length) {
      lines.push('## Compositions humans rated highly (use as positive inspiration):')
      for (const row of liked) {
        const vd = (row.variants as unknown as { variant_data: unknown } | null)?.variant_data
        if (vd) lines.push('```json\n' + JSON.stringify(vd, null, 2) + '\n```')
      }
    }

    // Negative few-shot examples
    if (disliked?.length) {
      lines.push('## Compositions humans rated poorly (avoid similar patterns):')
      for (const row of disliked) {
        const vd = (row.variants as unknown as { variant_data: unknown } | null)?.variant_data
        if (vd) lines.push('```json\n' + JSON.stringify(vd, null, 2) + '\n```')
      }
    }

    // Tag directives (threshold: 3+ votes)
    if (allFeedback?.length) {
      const tagCounts: Record<string, number> = {}
      for (const row of allFeedback) {
        for (const tag of (row.tags as string[] ?? [])) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
        }
      }
      const activeDirectives = Object.entries(tagCounts)
        .filter(([, count]) => count >= 3)
        .map(([tag]) => TAG_DIRECTIVES[tag])
        .filter(Boolean)
      if (activeDirectives.length) {
        lines.push('## Structural guidance from user feedback:')
        for (const d of activeDirectives) lines.push(`- ${d}`)
      }
    }

    // Free text notes
    if (notes?.length) {
      lines.push('## Recent human feedback notes:')
      for (const row of notes) {
        const prefix = row.vote === 'up' ? 'Liked:' : 'Disliked:'
        lines.push(`- ${prefix} "${row.note}"`)
      }
    }

    const ctx = lines.length ? '\n\n---\n# Human Feedback Context\n' + lines.join('\n') : ''
    if (ctx) console.log(`[feedback-context] injecting ${lines.length} lines into prompt`)
    else console.log('[feedback-context] no feedback in DB yet — generating without learning context')
    return ctx
  } catch (e) {
    console.error('[feedback-context]', e)
    return ''
  }
}

const GeneratedLayoutSchema = z.object({
  id:         z.string(),
  concept:    z.string(),
  theme:      z.enum(THEMES),
  background: z.string(),
  reasoning:  z.string(),
  logo:       z.string(),
  headline:   z.string(),
  body:       z.string(),
  eyebrow:    z.string(),
  cta:        z.string(),
})

const GenerateResponseSchema = z.object({
  variants: z.array(GeneratedLayoutSchema)
})

function buildUserMessage(req: GenerateRequest, accepted?: GeneratedLayout[]): string {
  const { input, platforms } = req
  const lines: string[] = [`Ad type: ${input.adType}`, `Platforms: ${platforms.join(', ')}`]

  if (input.adType === 'big-headline') {
    lines.push(`Headline: "${input.headline}"`)
    if (input.body)      lines.push(`Body: "${input.body}"`)
    if (input.stat)      lines.push(`Stat: ${input.stat} (${input.statLabel ?? ''})`)
    if (input.cta)       lines.push(`CTA: "${input.cta}"`)
    if (input.context)   lines.push(`Context: ${input.context}`)
  } else {
    lines.push(`Quote: "${input.quote}" — use headline slot`)
    if (input.name || input.titleAndCompany) {
      const attribution = [input.name, input.titleAndCompany].filter(Boolean).join(', ')
      lines.push(`Attribution: "${attribution}" — must appear, use body or eyebrow slot`)
    }
    if (input.cta)     lines.push(`CTA: "${input.cta}" — must appear, use cta slot`)
    if (input.context) lines.push(`Context: ${input.context}`)
  }

  if (accepted && accepted.length > 0) {
    lines.push('')
    lines.push('Already accepted — do NOT repeat these compositional approaches:')
    for (const v of accepted) {
      lines.push(`- "${v.concept}": ${v.reasoning}`)
    }
  }

  return lines.join('\n')
}

async function generateBatch(req: GenerateRequest, count: number, feedbackContext: string, accepted?: GeneratedLayout[]): Promise<GeneratedLayout[]> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: GenerateResponseSchema,
    system: SYSTEM_PROMPT + feedbackContext,
    prompt: buildUserMessage(req, accepted) + `\n\nGenerate exactly ${count} variant${count === 1 ? '' : 's'}.`,
  })
  return object.variants as GeneratedLayout[]
}

const MAX_ROUNDS = 3

function getPassThreshold(round: number): number {
  const thresholds: Record<number, number> = { 1: 6.5, 2: 6.2, 3: 5.9 }
  return thresholds[round] ?? 5.9
}

const JUDGE_EVAL_MESSAGES = [
  'Evaluating with The Creative Director…',
  'Evaluating with The Taste Maker…',
  'Evaluating with The Growth Hacker…',
]

export async function POST(req: Request) {
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

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'))

      try {
        const { evaluateVariants } = await import('@/lib/evaluate')
        const feedbackContext = await buildFeedbackContext()

        const target = body.count ?? 5
        const passing: GeneratedLayout[] = []
        const passingEvals: Awaited<ReturnType<typeof evaluateVariants>> = []
        // candidates tracks all evaluated variants across rounds for best-available fallback
        // seenCandidateKeys prevents adding the same round+id combo twice
        const candidates: Array<{ variant: GeneratedLayout; evaluation: Awaited<ReturnType<typeof evaluateVariants>>[number] }> = []
        const seenCandidateKeys = new Set<string>()
        let round = 0
        let reviewed = 0

        while (passing.length < target && round < MAX_ROUNDS) {
          round++
          if (target > 1) send({ type: 'status', message: `Round ${round}: generating compositions…` })

          const needed = Math.max(2, target - passing.length)
          const seedAccepted = body.accepted ?? (passing.length > 0 ? passing : undefined)
          const batch = await generateBatch(body, needed, feedbackContext, seedAccepted)
          reviewed += batch.length

          // Deduplicate concept names within the batch — model sometimes repeats the same concept
          const seenConcepts = new Set<string>()
          const deduped = batch.filter(v => {
            const key = v.concept.toLowerCase().trim()
            if (seenConcepts.has(key)) {
              console.log(`[dedupe] dropped duplicate concept "${v.concept}"`)
              return false
            }
            seenConcepts.add(key)
            return true
          })

          // Spatial validation — discard before judges see them
          const valid = deduped.filter(v => {
            const errors = validateVariant(v)
            if (errors.length > 0) {
              console.log(`[validate] rejected ${v.id} (${v.concept}):`, errors)
              return false
            }
            return true
          })

          if (valid.length === 0) {
            send({ type: 'status', message: `Round ${round}: all variants failed spatial validation, retrying…` })
            continue
          }

          // Cycle through judge messages evenly throughout evaluation
          let evalMsgIdx = 0
          send({ type: 'status', message: JUDGE_EVAL_MESSAGES[0] })
          const evalCycle = setInterval(() => {
            evalMsgIdx = (evalMsgIdx + 1) % JUDGE_EVAL_MESSAGES.length
            send({ type: 'status', message: JUDGE_EVAL_MESSAGES[evalMsgIdx] })
          }, 3500)

          const threshold = getPassThreshold(round)
          const evaluations = await evaluateVariants(valid, threshold)
          clearInterval(evalCycle)

          const seenIds = new Set(passing.map(v => v.id))
          for (const ev of evaluations) {
            const variant = valid.find(v => v.id === ev.id)
            if (!variant) continue

            // Track all evaluated variants as candidates for best-available fallback
            const roundKey = `${round}:${ev.id}`
            if (!seenCandidateKeys.has(roundKey)) {
              seenCandidateKeys.add(roundKey)
              candidates.push({ variant, evaluation: ev })
            }

            if (ev.pass && passing.length < target && !seenIds.has(ev.id)) {
              passing.push(variant)
              passingEvals.push(ev)
              seenIds.add(ev.id)
              if (target > 1) send({ type: 'status', message: `${passing.length} of ${target} variants approved…` })
            }
          }
        }

        // Best-available fallback: if we still need more variants, fill from candidates sorted by score
        if (passing.length < target) {
          const passingIds = new Set(passing.map(v => v.id))
          const sorted = [...candidates]
            .filter(c => !passingIds.has(c.variant.id))
            .sort((a, b) => b.evaluation.final - a.evaluation.final)

          for (const { variant, evaluation } of sorted) {
            if (passing.length >= target) break
            passing.push(variant)
            passingEvals.push(evaluation)
          }
        }

        const variants = passing.map((v, i) => ({ ...v, input: body.input, evaluation: passingEvals[i] }))
        send({ type: 'result', variants, meta: { rounds: round, reviewed, passed: passing.length } })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[/api/generate]', message)
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' }
  })
}
