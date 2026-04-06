import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Variant } from '@/lib/types'

export async function GET() {
  const supabase = getSupabaseAdmin()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, created_at, ad_type, platform_selection')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!sessions?.length) return NextResponse.json([])

  const sessionIds = sessions.map(s => s.id)
  const { data: variantRows } = await supabase
    .from('variants')
    .select('id, session_id, generation_index, variant_data')
    .in('session_id', sessionIds)
    .order('generation_index', { ascending: true })

  // Fetch feedback for all fetched variants
  const variantDbIds = (variantRows ?? []).map(r => r.id as string)
  const feedbackByVariantId = new Map<string, { vote: string; tags: string[]; note: string | null }>()
  if (variantDbIds.length > 0) {
    const { data: feedbackRows } = await supabase
      .from('feedback')
      .select('variant_id, vote, tags, note')
      .in('variant_id', variantDbIds)
    for (const row of feedbackRows ?? []) {
      feedbackByVariantId.set(row.variant_id as string, {
        vote: row.vote as string,
        tags: (row.tags as string[]) ?? [],
        note: row.note as string | null,
      })
    }
  }

  const variantsBySession = new Map<string, Variant[]>()
  const feedbackMapBySession = new Map<string, Record<string, { vote: string; tags: string[]; note: string | null }>>()

  // Track seen variant IDs per session to prevent duplicate keys
  const seenVariantIds = new Map<string, Set<string>>()

  for (const row of variantRows ?? []) {
    const sid = row.session_id as string
    const variant = row.variant_data as unknown as Variant
    const feedback = feedbackByVariantId.get(row.id as string)

    if (!seenVariantIds.has(sid)) seenVariantIds.set(sid, new Set())
    if (seenVariantIds.get(sid)!.has(variant.id)) continue
    seenVariantIds.get(sid)!.add(variant.id)

    if (!variantsBySession.has(sid)) variantsBySession.set(sid, [])
    variantsBySession.get(sid)!.push(variant)

    if (feedback) {
      if (!feedbackMapBySession.has(sid)) feedbackMapBySession.set(sid, {})
      feedbackMapBySession.get(sid)![variant.id] = feedback
    }
  }

  return NextResponse.json(sessions.map(s => ({
    ...s,
    variants: variantsBySession.get(s.id) ?? [],
    feedbackMap: feedbackMapBySession.get(s.id) ?? {},
  })))
}
