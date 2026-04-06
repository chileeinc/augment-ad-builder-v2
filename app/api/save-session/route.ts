import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Variant, AdInput, Platform } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { sessionId, input, platforms, variants, genIndex } = await req.json() as {
    sessionId: string | null
    input: AdInput
    platforms: Platform[]
    variants: Variant[]
    genIndex: number
  }

  const supabase = getSupabaseAdmin()
  let sid = sessionId

  if (!sid) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ ad_type: input.adType, platform_selection: platforms })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    sid = data.id as string
  }

  const rows = variants.map(v => ({
    session_id: sid,
    generation_index: genIndex,
    variant_data: v as unknown as Record<string, unknown>,
  }))

  const { data: inserted, error: variantError } = await supabase
    .from('variants')
    .insert(rows)
    .select('id, variant_data')
  if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })

  const variantDbIds: Record<string, string> = {}
  for (const row of inserted ?? []) {
    const appId = (row.variant_data as unknown as Variant).id
    variantDbIds[appId] = row.id as string
  }

  return NextResponse.json({ sessionId: sid, variantDbIds })
}
