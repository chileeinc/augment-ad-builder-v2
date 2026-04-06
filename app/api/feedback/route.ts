import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { sessionId, variantId, vote, tags, note } = await req.json() as {
    sessionId: string
    variantId: string   // app ID e.g. "g1-v1"
    vote: 'up' | 'down'
    tags: string[]
    note: string
  }

  const supabase = getSupabaseAdmin()

  // Fetch all variants for this session and find the match in JS.
  // More reliable than a PostgREST JSONB path filter.
  const { data: rows, error: fetchError } = await supabase
    .from('variants')
    .select('id, variant_data')
    .eq('session_id', sessionId)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const variantRow = rows?.find(r => {
    const vd = r.variant_data as { id?: string }
    return vd?.id === variantId
  })

  if (!variantRow) {
    console.error('[feedback] variant not found', { sessionId, variantId, rowCount: rows?.length })
    return NextResponse.json({ error: 'variant not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('feedback')
    .upsert(
      { variant_id: variantRow.id, session_id: sessionId, vote, tags, note: note || null },
      { onConflict: 'variant_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
