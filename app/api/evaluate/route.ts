import { NextResponse } from 'next/server'
import { evaluateVariants } from '@/lib/evaluate'
import type { GeneratedLayout } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const { variants, images }: { variants: GeneratedLayout[], images?: string[] } = await req.json()
    const evaluations = await evaluateVariants(variants, 6.5, images)
    return NextResponse.json({ evaluations })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/evaluate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
