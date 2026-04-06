import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { variantDbId, variantData } = await req.json() as {
    variantDbId: string
    variantData: Record<string, unknown>
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('variants')
    .update({ variant_data: variantData })
    .eq('id', variantDbId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
