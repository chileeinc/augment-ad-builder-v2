'use client'
import { useState } from 'react'
import type { Variant, Platform } from '@/lib/types'
import VariantGrid from '@/components/VariantGrid'
import ExportModal from '@/components/ExportModal'

interface ExportTarget {
  element: HTMLElement
  variant: Variant
}

interface HistoryDetailClientProps {
  generations: Variant[][]
  platforms: string[]
}

export default function HistoryDetailClient({ generations, platforms }: HistoryDetailClientProps) {
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)

  return (
    <div className="space-y-8">
      {generations.map((variants, i) => (
        <div key={i} className="space-y-2">
          {generations.length > 1 && (
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Generation {i + 1}
            </p>
          )}
          <VariantGrid
            variants={variants}
            loading={false}
            onExport={(el, variant) => setExportTarget({ element: el, variant })}
          />
        </div>
      ))}

      {exportTarget && (
        <ExportModal
          variant={exportTarget.variant}
          element={exportTarget.element}
          platforms={platforms as Platform[]}
          onClose={() => setExportTarget(null)}
        />
      )}
    </div>
  )
}
