import type { Variant, BigHeadlineInput } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './BigTypeBody.css'

interface Props { variant: Variant }

export default function BigTypeBody({ variant }: Props) {
  const input = variant.input as BigHeadlineInput
  return (
    <div className="tpl-btb">
      <div className="btb-logo"><AugmentLogo /></div>
      <div className="btb-main">
        <div className="btb-headline">{input.headline}</div>
        {input.body && <div className="btb-body">{input.body}</div>}
      </div>
      {input.cta && (
        <div className="btb-footer">
          <button className="btb-cta">{input.cta}</button>
        </div>
      )}
    </div>
  )
}
