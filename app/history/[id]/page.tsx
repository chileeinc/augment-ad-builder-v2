import '@/app/ui.css'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import HistoryDetailClient from './HistoryDetailClient'
import type { Variant } from '@/lib/types'

async function getSession(id: string) {
  const supabase = getSupabaseAdmin()
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, created_at, ad_type, platform_selection, thumbnail_urls')
    .eq('id', id)
    .single()
  if (error || !session) return null

  const { data: variantRows } = await supabase
    .from('variants')
    .select('id, generation_index, variant_data')
    .eq('session_id', id)
    .order('generation_index', { ascending: true })

  return { session, variantRows: variantRows ?? [] }
}

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getSession(id)
  if (!result) notFound()

  const { session, variantRows } = result

  // Group variants by generation_index
  const byGen = new Map<number, Variant[]>()
  for (const row of variantRows) {
    const idx = row.generation_index as number
    const variant = row.variant_data as unknown as Variant
    if (!byGen.has(idx)) byGen.set(idx, [])
    byGen.get(idx)!.push(variant)
  }
  const generations = Array.from(byGen.entries())
    .sort(([a], [b]) => a - b)
    .map(([, variants]) => variants)

  const date = new Date(session.created_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold capitalize">{session.ad_type} · {date}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session.platform_selection.join(', ')} · {variantRows.length} variants
          </p>
        </div>
        <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← History
        </Link>
      </div>
      <HistoryDetailClient
        generations={generations}
        platforms={session.platform_selection as string[]}
      />
    </main>
  )
}
