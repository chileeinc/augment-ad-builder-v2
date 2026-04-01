import type { Variant, QuoteInput } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './CustomerQuote.css'

interface Props { variant: Variant }

export default function CustomerQuote({ variant }: Props) {
  const input = variant.input as QuoteInput
  return (
    <div className="tpl-cq">
      <div className="cq-logo"><AugmentLogo /></div>
      <div className="cq-content">
        <div className="cq-quote">
          <span className="cq-quote-mark">&ldquo;</span>{input.quote}
        </div>
        {(input.name || input.titleAndCompany) && (
          <div className="cq-attribution">
            {input.name && <div className="cq-name">{input.name}</div>}
            {input.titleAndCompany && <div className="cq-title">{input.titleAndCompany}</div>}
          </div>
        )}
      </div>
      {input.cta && (
        <div className="cq-footer">
          <button className="cq-cta">{input.cta}</button>
        </div>
      )}
    </div>
  )
}
