'use client'
import { useState } from 'react'
import type { AdType, AdInput, Platform, BigHeadlineInput, QuoteInput } from '@/lib/types'
import { PLATFORM_LABELS } from '@/lib/constants'
import './AdForm.css'

interface Props {
  onGenerate: (input: AdInput, platforms: Platform[]) => void
  loading: boolean
}

const ALL_PLATFORMS: Platform[] = ['linkedin', 'twitter', 'reddit', 'google-display']

export default function AdForm({ onGenerate, loading }: Props) {
  const [adType, setAdType] = useState<AdType>('big-headline')
  const [platforms, setPlatforms] = useState<Platform[]>(['linkedin'])

  // Big Headline fields
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [cta, setCta] = useState('')
  const [stat, setStat] = useState('')
  const [statLabel, setStatLabel] = useState('')
  const [context, setContext] = useState('')

  // Quote fields
  const [quote, setQuote] = useState('')
  const [name, setName] = useState('')
  const [titleAndCompany, setTitleAndCompany] = useState('')
  const [quoteCta, setQuoteCta] = useState('')
  const [quoteContext, setQuoteContext] = useState('')

  function fillPlaceholder(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: (v: string) => void
  ) {
    if (e.key === 'Tab' && !e.currentTarget.value) {
      e.preventDefault()
      setter(e.currentTarget.placeholder)
    }
  }

  function togglePlatform(p: Platform) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function isValid() {
    if (platforms.length === 0) return false
    if (adType === 'big-headline') return headline.trim().length > 0
    return quote.trim().length > 0 && name.trim().length > 0 && titleAndCompany.trim().length > 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid() || loading) return

    let input: AdInput
    if (adType === 'big-headline') {
      input = {
        adType: 'big-headline',
        headline: headline.trim(),
        body: body.trim() || null,
        cta: cta.trim() || null,
        stat: stat.trim() || null,
        statLabel: statLabel.trim() || null,
        context: context.trim() || null
      } satisfies BigHeadlineInput
    } else {
      input = {
        adType: 'quote',
        quote: quote.trim().replace(/^["'"'"]+|["'"'"]+$/g, '').trim(),
        name: name.trim(),
        titleAndCompany: titleAndCompany.trim(),
        cta: quoteCta.trim() || null,
        context: quoteContext.trim() || null
      } satisfies QuoteInput
    }

    onGenerate(input, platforms)
  }

  return (
    <form className="ad-form" onSubmit={handleSubmit}>
      <div className="ad-type-toggle">
        <button type="button" className={`ad-type-btn${adType === 'big-headline' ? ' active' : ''}`} onClick={() => setAdType('big-headline')}>Big Headline</button>
        <button type="button" className={`ad-type-btn${adType === 'quote' ? ' active' : ''}`} onClick={() => setAdType('quote')}>Quote</button>
      </div>

      {adType === 'big-headline' ? (
        <div className="form-fields">
          <div className="form-field">
            <label className="field-label">Headline</label>
            <input className="field-input" value={headline} onChange={e => setHeadline(e.target.value)} onKeyDown={e => fillPlaceholder(e, setHeadline)} placeholder="Code review, 10% faster." />
          </div>
          <div className="form-field">
            <label className="field-label">Body copy <span>Optional</span></label>
            <textarea className="field-textarea" rows={2} value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => fillPlaceholder(e, setBody)} placeholder="Augment integrates with your existing tools and workflows." />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="field-label">Stat <span>Optional</span></label>
              <input className="field-input" value={stat} onChange={e => setStat(e.target.value)} onKeyDown={e => fillPlaceholder(e, setStat)} placeholder="10%" />
            </div>
            <div className="form-field">
              <label className="field-label">Stat label <span>Optional</span></label>
              <input className="field-input" value={statLabel} onChange={e => setStatLabel(e.target.value)} onKeyDown={e => fillPlaceholder(e, setStatLabel)} placeholder="faster dev speed" />
            </div>
          </div>
          <div className="form-field">
            <label className="field-label">CTA <span>Optional</span></label>
            <input className="field-input" value={cta} onChange={e => setCta(e.target.value)} onKeyDown={e => fillPlaceholder(e, setCta)} placeholder="Try free →" />
          </div>
          <div className="form-field">
            <label className="field-label">Context <span>Not shown in ad</span></label>
            <input className="field-input" value={context} onChange={e => setContext(e.target.value)} onKeyDown={e => fillPlaceholder(e, setContext)} placeholder="LinkedIn retargeting, senior devs who've seen the product" />
          </div>
        </div>
      ) : (
        <div className="form-fields">
          <div className="form-field">
            <label className="field-label">Quote</label>
            <textarea className="field-textarea" rows={3} value={quote} onChange={e => setQuote(e.target.value)} onKeyDown={e => fillPlaceholder(e, setQuote)} placeholder="Augment cut our review time in half." />
          </div>
          <div className="form-field">
            <label className="field-label">Name</label>
            <input className="field-input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => fillPlaceholder(e, setName)} placeholder="Sarah Chen" />
          </div>
          <div className="form-field">
            <label className="field-label">Title & Company</label>
            <input className="field-input" value={titleAndCompany} onChange={e => setTitleAndCompany(e.target.value)} onKeyDown={e => fillPlaceholder(e, setTitleAndCompany)} placeholder="Staff Engineer · Vercel" />
          </div>
          <div className="form-field">
            <label className="field-label">CTA <span>Optional</span></label>
            <input className="field-input" value={quoteCta} onChange={e => setQuoteCta(e.target.value)} onKeyDown={e => fillPlaceholder(e, setQuoteCta)} placeholder="Read the story →" />
          </div>
          <div className="form-field">
            <label className="field-label">Context <span>Not shown in ad</span></label>
            <input className="field-input" value={quoteContext} onChange={e => setQuoteContext(e.target.value)} onKeyDown={e => fillPlaceholder(e, setQuoteContext)} placeholder="LinkedIn, social proof campaign" />
          </div>
        </div>
      )}

      <div className="form-divider" />

      <div>
        <div className="platforms-label">Platforms</div>
        <div className="platforms-grid">
          {ALL_PLATFORMS.map(p => (
            <button key={p} type="button" className={`platform-chip${platforms.includes(p) ? ' selected' : ''}`} onClick={() => togglePlatform(p)}>
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <button className="generate-btn" type="submit" disabled={!isValid() || loading}>
        {loading ? 'Generating…' : 'Generate 5 designs →'}
      </button>
    </form>
  )
}
