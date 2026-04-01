import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './CustomerQuote.css'

interface Props { variant: Variant }

export default function CustomerQuote({ variant }: Props) {
  return (
    <div className="tpl-cq">
      <div className="cq-logo"><AugmentLogo /></div>
      <div className="cq-content">
        <div className="cq-quote">
          <span className="cq-quote-mark">"</span>{variant.headline}
        </div>
      </div>
      {variant.cta && (
        <div className="cq-footer">
          <button className="cq-cta">{variant.cta}</button>
        </div>
      )}
    </div>
  )
}
