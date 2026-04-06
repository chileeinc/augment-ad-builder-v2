import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Variant } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { variantDbIds, variants, sessionId, thumbnails } = await req.json() as {
    variantDbIds: Record<string, string>
    variants: Variant[]
    sessionId: string | null
    thumbnails?: Record<string, string> // variantId → dataUrl
  }

  const supabase = getSupabaseAdmin()

  // Patch evaluation scores onto each variant row
  for (const v of variants) {
    if (!v.evaluation) continue
    const dbId = variantDbIds[v.id]
    if (!dbId) continue
    await supabase
      .from('variants')
      .update({ variant_data: v as unknown as Record<string, unknown> })
      .eq('id', dbId)
  }

  // Upload thumbnails + patch session if provided
  if (sessionId && thumbnails && Object.keys(thumbnails).length > 0) {
    const BUCKET = 'ad-thumbnails'
    const urls: string[] = []

    for (const [variantId, dataUrl] of Object.entries(thumbnails)) {
      const [header, base64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: mime })

      const path = `${sessionId}/${variantId}.png`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/png', upsert: true })
      if (!error) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }

    if (urls.length > 0) {
      await supabase.from('sessions').update({ thumbnail_urls: urls }).eq('id', sessionId)
    }
  }

  return NextResponse.json({ ok: true })
}
