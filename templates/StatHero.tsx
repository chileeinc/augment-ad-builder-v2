import type { Variant, BigHeadlineInput } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './StatHero.css'

interface Props { variant: Variant }

export default function StatHero({ variant }: Props) {
  const input = variant.input as BigHeadlineInput
  return (
    <div className="tpl-sh">
      {input.stat && <div className="sh-stat">{input.stat}</div>}
      {input.statLabel && <div className="sh-stat-label">{input.statLabel}</div>}
      <div className="sh-headline">{input.headline}</div>
      <div className="sh-footer">
        {input.cta && <div className="sh-cta">{input.cta}</div>}
        <div className="sh-logo"><AugmentLogo /></div>
      </div>
    </div>
  )
}
