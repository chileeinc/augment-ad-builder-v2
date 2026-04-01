import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './BigTypeBody.css'

interface Props { variant: Variant }

export default function BigTypeBody({ variant }: Props) {
  return (
    <div className="tpl-btb">
      <div className="btb-logo"><AugmentLogo /></div>
      <div className="btb-main">
        <div className="btb-headline">{variant.headline}</div>
      </div>
      {variant.cta && (
        <div className="btb-footer">
          <button className="btb-cta">{variant.cta}</button>
        </div>
      )}
    </div>
  )
}
