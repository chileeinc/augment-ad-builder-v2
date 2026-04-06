import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Delete storage files
  const { data: files } = await supabase.storage.from('ad-thumbnails').list(id)
  if (files && files.length > 0) {
    await supabase.storage.from('ad-thumbnails').remove(files.map(f => `${id}/${f.name}`))
  }

  // Delete session (cascades to variants + feedback via FK)
  await supabase.from('sessions').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
