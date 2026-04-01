import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './StatHero.css'

interface Props { variant: Variant }

export default function StatHero({ variant }: Props) {
  return (
    <div className="tpl-sh">
      {variant.stat && <div className="sh-stat">{variant.stat}</div>}
      {variant.stat_label && <div className="sh-stat-label">{variant.stat_label}</div>}
      <div className="sh-headline">{variant.headline}</div>
      <div className="sh-footer">
        {variant.cta && <div className="sh-cta">{variant.cta}</div>}
        <div className="sh-logo"><AugmentLogo /></div>
      </div>
    </div>
  )
}
