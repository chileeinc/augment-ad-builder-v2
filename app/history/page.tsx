import '@/app/ui.css'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Variant } from '@/lib/types'
import SessionList from '@/components/history/SessionList'

export interface SessionWithVariants {
  id: string
  created_at: string
  ad_type: string
  platform_selection: string[]
  variants: Variant[]
}

async function getSessions(): Promise<SessionWithVariants[]> {
  const supabase = getSupabaseAdmin()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, created_at, ad_type, platform_selection')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  if (!sessions?.length) return []

  // Fetch first-generation variants for each session
  const sessionIds = sessions.map(s => s.id)
  const { data: variantRows } = await supabase
    .from('variants')
    .select('session_id, generation_index, variant_data')
    .in('session_id', sessionIds)
    .eq('generation_index', 1)

  const variantsBySession = new Map<string, Variant[]>()
  for (const row of variantRows ?? []) {
    const sid = row.session_id as string
    if (!variantsBySession.has(sid)) variantsBySession.set(sid, [])
    variantsBySession.get(sid)!.push(row.variant_data as unknown as Variant)
  }

  return sessions.map(s => ({
    ...s,
    variants: variantsBySession.get(s.id) ?? [],
  }))
}

export default async function HistoryPage() {
  const sessions = await getSessions()

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-inter, sans-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary, #f5f5f7)', margin: 0 }}>Session History</h1>
        <Link href="/" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--text-muted, #888)', textDecoration: 'none', letterSpacing: '0.06em' }}>
          ← Back to builder
        </Link>
      </div>
      <SessionList sessions={sessions} />
    </main>
  )
}
