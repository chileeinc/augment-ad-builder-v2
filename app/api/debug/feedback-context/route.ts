import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabaseAdmin()

  const { data: liked } = await supabase
    .from('feedback')
    .select('variant_id, tags, note, variants(variant_data)')
    .eq('vote', 'up')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: disliked } = await supabase
    .from('feedback')
    .select('variant_id, tags, note, variants(variant_data)')
    .eq('vote', 'down')
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: allFeedback } = await supabase
    .from('feedback')
    .select('vote, tags')

  const { data: notes } = await supabase
    .from('feedback')
    .select('note, vote')
    .not('note', 'is', null)
    .neq('note', '')
    .order('created_at', { ascending: false })
    .limit(5)

  const tagCounts: Record<string, number> = {}
  for (const row of allFeedback ?? []) {
    for (const tag of (row.tags as string[] ?? [])) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  return NextResponse.json({
    summary: {
      liked_count: liked?.length ?? 0,
      disliked_count: disliked?.length ?? 0,
      total_feedback: allFeedback?.length ?? 0,
      notes_count: notes?.length ?? 0,
      tag_counts: tagCounts,
    },
    liked_variant_ids: liked?.map(r => r.variant_id),
    disliked_variant_ids: disliked?.map(r => r.variant_id),
    notes: notes?.map(r => ({ vote: r.vote, note: r.note })),
    will_inject: (liked?.length ?? 0) > 0 || (disliked?.length ?? 0) > 0 || (notes?.length ?? 0) > 0,
  })
}
