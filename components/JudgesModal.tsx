'use client'
import './JudgesModal.css'

interface Props {
  onClose: () => void
}

const JUDGES = [
  {
    id: 'designer',
    name: 'The Designer',
    persona: 'Senior Brand Design Director. Ex-Pentagram. Here for design rigor.',
    color: '#aaaaaa',
    dimensions: [
      { code: 'D1', name: 'Typographic Authority', desc: 'Clear hierarchy — one dominant voice, supporting voices that don\'t compete.' },
      { code: 'D2', name: 'Compositional Rigour', desc: 'Structural logic to placement. Elements feel designed, not dropped in.' },
      { code: 'D3', name: 'Brand Fidelity', desc: 'Right palette, right fonts, right logo. Feels like Augment — technical, sharp.' },
      { code: 'D4', name: 'Craft', desc: 'Every element deliberately placed. No sloppiness, no near-misses.' },
    ],
  },
  {
    id: 'taste',
    name: 'The Taste Maker',
    persona: 'Senior Developer, 25–35. Design-literate. Deeply tuned into the dev tooling scene.',
    color: '#1AA049',
    dimensions: [
      { code: 'D1', name: 'Cultural Currency', desc: 'Belongs to the current moment. References the visual language of Vercel, Linear, Zed.' },
      { code: 'D2', name: 'Taste', desc: 'Evidence of a discerning eye. Conscious choices — not a formula.' },
      { code: 'D3', name: 'Experimental Energy', desc: 'Explores something new without becoming chaotic. Feels iterative, slightly unresolved.' },
      { code: 'D4', name: 'System Novelty', desc: 'Introduces a visual logic that feels constructed, not reused.' },
    ],
  },
  {
    id: 'growth',
    name: 'The Growth Hacker',
    persona: 'Growth Operator. Obsessed with attention, clarity, and real-world performance.',
    color: '#5CCC76',
    dimensions: [
      { code: 'D1', name: 'Instant Comprehension', desc: 'Do I get it in 1–2 seconds? Core message immediately clear.' },
      { code: 'D2', name: 'Stopping Power', desc: 'Would someone pause scrolling? Visual tension, scale contrast, surprise.' },
      { code: 'D3', name: 'Message Dominance', desc: 'One idea clearly wins. Headline is the undisputed hero.' },
      { code: 'D4', name: 'Signal-to-Noise', desc: 'Everything shown serves the message. Clean and purposeful at a glance.' },
    ],
  },
]

export default function JudgesModal({ onClose }: Props) {
  return (
    <div className="judges-backdrop" onClick={onClose}>
      <div className="judges-modal" onClick={e => e.stopPropagation()}>

        <div className="judges-header">
          <div className="judges-header-left">
            <div className="judges-title">The Panel</div>
            <div className="judges-subtitle">Three independent judges evaluate every design on four dimensions from a score of 1–10. 2 of 3 must pass for a variant to surface.</div>
          </div>
          <button className="judges-close" onClick={onClose}>✕</button>
        </div>

        <div className="judges-grid">
          {JUDGES.map(judge => (
            <div key={judge.id} className="judge-card">
              <div className="judge-card-header">
                <div className="judge-name" style={{ color: judge.color }}>{judge.name}</div>
                <div className="judge-persona">{judge.persona}</div>
              </div>
              <div className="judge-dimensions">
                {judge.dimensions.map(d => (
                  <div key={d.code} className="judge-dimension">
                    <div className="dimension-header">
                      <span className="dimension-code" style={{ color: judge.color }}>{d.code}</span>
                      <span className="dimension-name">{d.name}</span>
                    </div>
                    <div className="dimension-desc">{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="judges-footer">
          <div className="judges-footer-item">
            <span className="judges-footer-label">Pass threshold</span>
            6.5+ average across four dimensions. Softens to 5.9 by round 3 if the batch needs filling.
          </div>
          <div className="judges-footer-divider" />
          <div className="judges-footer-item">
            <span className="judges-footer-label">Auto-fail</span>
            Missing logo, missing user copy, or duplicate composition logic → score 0, no appeal.
          </div>
        </div>

      </div>
    </div>
  )
}
