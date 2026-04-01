# AI Ad Builder — Design Spec

**Version:** 1.0
**Date:** 2026-04-01
**Status:** Draft — awaiting user review

---

## 1. Overview

A prompt-driven ad creation tool that generates 5 design variations using the Claude API. The user describes what the ad should communicate, picks where it will run, reviews AI-generated variants, and exports directly. No template picker, no form-based copy panel.

**Goal:** Replace manual template selection + copy entry with a single prompt → variations → export flow that gets smarter from feedback over time.

---

## 2. User Flow

```
[1] Prompt input
    User types: "Augment makes devs 10% faster at code review"

[2] Platform selection
    Picks: LinkedIn, Instagram, X/Twitter, Reddit, Google Display
    → Determines which export sizes are available

[3] AI generates 5 variations
    Each variant = unique combination of layout, theme, copy angle, headline, CTA

[4] User reviews variants
    - Thumbs up / thumbs down per variant
    - Optional text note: "stats should be more prominent" / "logo too small"

[5] In-session regeneration (optional)
    Feedback adjusts generation params → new set of 5 variants

[6] Export
    Pick final variant → download at platform-correct sizes
```

---

## 3. Ad Templates (MVP)

Three layout types for MVP. AI picks which to use per variant. Line Editorial and Illustration are deferred post-MVP.

| Template | Description |
|---|---|
| `big-type-body` | Large headline dominates, small supporting copy, logo, optional CTA |
| `stat-hero` | Big metric/number as hero element, headline, logo |
| `customer-quote` | Pull quote + attribution, logo |

### Post-MVP (deferred)
- `line-editorial` — large headline + horizontal line pattern lower third
- `illustration` — large headline + brand illustration from `illustration-inspo/` library

---

## 4. Variation Parameters

Each of the 5 variants is defined by these parameters. AI picks values for each.

| Parameter | Options |
|---|---|
| `layout` | `big-type-body`, `stat-hero`, `customer-quote` (MVP) |
| `theme` | `dark`, `light`, `tonal` |
| `background` | `none`, `dot-grid`, `grid` |
| `copy_angle` | `metric-led`, `benefit`, `bold-claim`, `brand-awareness` |
| `headline` | AI-written string, derived from user prompt |
| `cta` | `null` or AI-written string (e.g. "Try free →") |
| `stat` | Numeric or short string extracted from prompt (optional) |
| `stat_label` | Supporting label for stat (optional) |
| `illustration_id` | deferred post-MVP |

The 5 variants should collectively:
- Cover at least 2 different themes
- Cover at least 2 different layouts
- Vary copy angle across variants

---

## 5. Platform & Export Sizes

| Platform | Sizes |
|---|---|
| LinkedIn | 1200×627, 1080×1080 |
| Instagram | 1080×1080, 1080×1350 |
| X / Twitter | 1200×675, 1080×1080 |
| Reddit | 1200×628 |
| Google Display | 300×250, 728×90, 160×600, 300×600 |

User selects platform(s) at step 2. Export generates all applicable sizes for the chosen variant.

---

## 6. Design Tokens

All templates share a common CSS token layer. Three themes:

| Token | Dark | Light | Tonal |
|---|---|---|---|
| `--ad-bg` | `#0a0a0b` | `#ffffff` | `#002400` |
| `--ad-fg` | `#f5f5f7` | `#111111` | `#99F7A9` |
| `--ad-fg-muted` | `#888888` | `#666666` | `#5CCC76` |
| `--ad-fg-dim` | `#555555` | `#999999` | `#1a3a1a` |
| `--ad-accent` | `#1AA049` | `#1AA049` | `#99F7A9` |
| `--ad-border` | `#1e1e26` | `#e5e5e7` | `#1a3a1a` |
| `--ad-border-subtle` | `#2a2a35` | `#d0d0d4` | `#0d2a0d` |

Background patterns:
- `dot-grid`: `radial-gradient(circle, [border-subtle] 1px, transparent 1px)` at `7px 7px`
- `grid`: two `linear-gradient` lines at `8px 8px`

Typography: system sans-serif (maps to `SF Pro Display` / `Helvetica Neue`). Weights: 300 (headlines), 400 (body), 600 (CTA).

Logo: `AugmentLogo` SVG component using `currentColor` — inherits `--ad-fg-dim` from wrapper.

---

## 7. AI Generation

### Claude API call
- Model: `claude-sonnet-4-6` (or configurable)
- System prompt includes:
  - Augment brand voice guidelines
  - Template + parameter definitions (from this spec)
  - Recent feedback examples (few-shot, from Supabase — last 20 rated variants)
- User message: the ad prompt
- Response: JSON array of 5 variant objects (structured output)

### Variant JSON schema
```json
{
  "id": "v1",
  "layout": "stat-hero",
  "theme": "dark",
  "background": "dot-grid",
  "copy_angle": "metric-led",
  "headline": "10% faster. Every dev.",
  "cta": "Try free →",
  "stat": "10%",
  "stat_label": "faster dev speed",
  "illustration_id": null,
  "reasoning": "Metric-led angle with stat hero layout for high impact on LinkedIn feed"
}
```

---

## 8. Feedback & Persistent Learning

### Per-session
Thumbs up/down + text note on any variant → appended to session context → included in next generation call within same session.

### Cross-session (Supabase)
Each rated variant is stored:
```sql
CREATE TABLE ad_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  prompt text NOT NULL,
  variant_params jsonb NOT NULL,   -- full variant object
  rating int NOT NULL,             -- 1 = thumbs up, -1 = thumbs down
  note text,                       -- user's text note
  platform text[]                  -- platforms selected for this session
);
```

### Few-shot injection
On each generation call, fetch last 20 rated variants from Supabase. Format as few-shot examples in the system prompt:
```
[GOOD] layout=stat-hero, theme=dark, copy_angle=metric-led → "10% faster. Every dev."
[BAD] layout=illustration, theme=light, copy_angle=brand-awareness → "Your AI co-pilot"
[NOTE on BAD] "logo looks too small, illustration too soft for LinkedIn"
```

---

## 9. Living Doc

### In-app `/knowledge` page
- Shows current generation guidelines (from Supabase `ai_guidelines` table)
- Shows recent feedback summary
- Auto-updates when Claude summarizes new feedback patterns

### `docs/ai-learnings.md` (this repo)
- Auto-committed via GitHub API whenever guidelines are updated
- Provides a version-controlled audit trail of how AI behavior evolves

### Update trigger
After every 10 new feedback entries, Claude API summarizes patterns → updates `ai_guidelines` row in Supabase → commits `docs/ai-learnings.md` to GitHub.

---

## 10. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | API routes keep Anthropic key server-side; `/knowledge` page SSR; Vercel deployment zero-config |
| Styling | CSS custom properties + modules | No Tailwind — token-based like v1 |
| Ad rendering | React client components | Templates ported from v1 as-is |
| AI generation | **Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)** | Streams 5 variants one-by-one as Claude generates them; better UX than waiting for full response |
| Persistence | Supabase JS client (`@supabase/supabase-js`) | Feedback + guidelines tables — **new project to be created**; anon key safe client-side with RLS |
| Export | `html-to-image` | Runs client-side only; `pixelRatio: 2` for retina; requires `document.fonts.ready` before capture |
| Deployment | **Vercel** | Zero config for Next.js; env vars set in dashboard |
| GitHub commits | GitHub REST API | Auto-commit `docs/ai-learnings.md` to `github.com/chileeinc/augment-ad-builder-v2` |
| Testing | Vitest + Testing Library | Same as v1 |

---

## 11. App Structure (proposed)

```
tool-ad-builder-v2/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # / — builder page
│   ├── knowledge/
│   │   └── page.tsx               # /knowledge — living doc viewer
│   └── api/
│       └── generate/
│           └── route.ts           # POST /api/generate — Claude call (server-side, key never exposed)
├── components/
│   ├── PromptInput.tsx            # Step 1: prompt + platform selection
│   ├── VariantGrid.tsx            # Step 3: 5-up variant display
│   ├── VariantCard.tsx            # Single variant + thumbs UI
│   ├── ExportModal.tsx            # Size selection + download
│   └── AugmentLogo.tsx            # SVG logo (from v1)
├── templates/                     # Ad layout components (ported from v1)
│   ├── BigTypeBody.tsx
│   ├── StatHero.tsx
│   ├── CustomerQuote.tsx
│   └── templates.css
├── lib/
│   ├── generate.ts                # Client-side fetch to /api/generate
│   ├── feedback.ts                # Supabase feedback read/write
│   ├── export.ts                  # html-to-image logic
│   ├── github.ts                  # GitHub API commit for ai-learnings.md
│   └── types.ts                   # Shared types (Variant, Platform, Theme, etc.)
├── docs/
│   └── ai-learnings.md            # Auto-committed by Claude
└── package.json
```

---

## 12. Out of Scope (v2)

- User accounts / saved ads
- A/B performance tracking
- Video / animated ad formats
- Collaborative editing
- Custom brand upload (non-Augment use cases)
