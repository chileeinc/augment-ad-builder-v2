import { supabase } from '@/lib/supabase'
import type { Variant, AdInput, Platform } from '@/lib/types'

const BUCKET = 'ad-thumbnails'

export type SaveResult = {
  sessionId: string
  variantDbIds: Map<string, string> // appId (e.g. "g1-v2") → db UUID
}

export async function saveGeneration(
  sessionId: string | null,
  input: AdInput,
  platforms: Platform[],
  variants: Variant[],
  genIndex: number
): Promise<SaveResult> {
  let sid = sessionId

  if (!sid) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ ad_type: input.adType, platform_selection: platforms })
      .select('id')
      .single()
    if (error) throw error
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
  if (variantError) throw variantError

  const variantDbIds = new Map<string, string>()
  for (const row of inserted ?? []) {
    const appId = (row.variant_data as unknown as Variant).id
    variantDbIds.set(appId, row.id as string)
  }

  return { sessionId: sid, variantDbIds }
}

export async function patchVariantEvaluations(
  variantDbIds: Map<string, string>,
  variants: Variant[]
): Promise<void> {
  for (const v of variants) {
    if (!v.evaluation) continue
    const dbId = variantDbIds.get(v.id)
    if (!dbId) continue
    await supabase
      .from('variants')
      .update({ variant_data: v as unknown as Record<string, unknown> })
      .eq('id', dbId)
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function uploadThumbnails(
  sessionId: string,
  images: Map<string, string>
): Promise<string[]> {
  const urls: string[] = []
  for (const [variantId, dataUrl] of images) {
    const blob = dataUrlToBlob(dataUrl)
    const path = `${sessionId}/${variantId}.png`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/png', upsert: true })
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      urls.push(data.publicUrl)
    }
  }
  return urls
}

export async function patchSessionThumbnails(
  sessionId: string,
  urls: string[]
): Promise<void> {
  await supabase
    .from('sessions')
    .update({ thumbnail_urls: urls })
    .eq('id', sessionId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { data: files } = await supabase.storage.from(BUCKET).list(sessionId)
  if (files && files.length > 0) {
    await supabase.storage
      .from(BUCKET)
      .remove(files.map(f => `${sessionId}/${f.name}`))
  }
  await supabase.from('sessions').delete().eq('id', sessionId)
}
