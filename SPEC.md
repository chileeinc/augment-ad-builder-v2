# Augment Ad Builder v2 — Product Spec

**Last updated:** 2026-04-07
**Status:** Active development

**Stack:** Next.js App Router · Vercel AI SDK · Zod · html-to-image · Supabase · shadcn/ui + Tailwind

**CSS boundary:**
- Ad canvas (`AdRenderer`, `FreeformCanvas`, `app/templates.css`) — plain CSS only, never Tailwind
- Existing UI (`AdForm`, `ExportModal`, `VariantCard`) — plain CSS, migrate only during intentional redesigns
- All new pages (`/history`, `/admin`, feedback UI) — shadcn/Tailwind from the start
- Tailwind `preflight` disabled to prevent conflicts with existing CSS

---

## 1. What This Is

An internal tool for Augment's marketing and growth team to generate, evaluate, rank, and export on-brand social ads using AI. Users provide copy; the AI invents the visual composition. A panel of three AI judges evaluates every design before it surfaces. Humans can rank results and provide feedback that persistently improves future generations.

**Core loop:**
1. User enters copy + selects platforms
2. AI generates 5 compositionally distinct ad variants
3. 3-judge AI panel evaluates and filters — only passing designs surface
4. User views, ranks, gives feedback
5. User selects a variant, previews at target platform size, exports as PNG

---

## 2. Users

- Augment marketing and growth team (~5 concurrent users)
- No login/authentication — shared access via internal link
- Shared history — all sessions visible to everyone, anyone can delete
- Not public-facing

---

## 3. Ad Types

| Type | Status | Description |
|---|---|---|
| Big Headline | Live | Stat-driven or claim-driven. Headline dominates. Optional body, stat, stat label, CTA. |
| Quote | Live | Customer or team quote. Attribution (name, title + company) always in mono label. Optional CTA. |
| Product Screenshot | Planned (Phase 2) | User uploads a screenshot. AI composes around it. Screenshot always in bottom half of canvas; headline/copy always top half. Phase 2: AI generates stylized representation. |
| Event | Planned (Phase 2) | Event title, date, time, speaker. Fixed content slots. |

---

## 4. Canvas & Rendering System

**Base canvas:** 1080×1080px. All elements absolutely positioned within it.

**Themes (locked — no deviation):**

| Theme | Background | Foreground | Accent |
|---|---|---|---|
| `dark` | `#0a0a0b` | `#fafafa` | `#1AA049` |
| `light` | `#ffffff` | `#0a0a0b` | `#1AA049` |
| `tonal` | `#002400` | `#99F7A9` | `#99F7A9` |

Tonal is strictly two-color — only `#002400` and `#99F7A9` permitted. No gradients, no additional values.

**Backgrounds:**
- `none` — solid theme color
- `dot-grid` — 1px dots, 30px spacing
- `grid` — hairline grid, 30px spacing
- Custom CSS background (dark/light only — gradients, patterns, geometry using brand palette)

**Typography:**

| Role | Font | Size | Weight |
|---|---|---|---|
| Headline | Inter | 48–200px | 300 |
| Body | Inter | 30–44px | 400 |
| Eyebrow | Source Code Pro | 20–26px | 400 |
| Mono label | Source Code Pro | 20–26px | 400 |
| CTA | Inter | 30–40px | 500–600 |

Font normalization is enforced in the renderer — unknown or serif fonts are mapped to Inter or Source Code Pro. The AI sets `fontFamily` to `"inter"` or `"mono"` only.

**Slots:**

| Slot | `data-slot` | Required |
|---|---|---|
| Logo | `logo` | Always |
| Headline | `headline` | Always |
| Body | `body` | If user provided |
| Eyebrow | `eyebrow` | If user provided stat/label |
| CTA | `cta` | If user provided |
| Attribution | `attribution` | Quote ads only |

Every input the user provides must appear in every variant — the AI decides placement, not whether to include it.

**Invariants the renderer enforces (not the AI):**
- Font family always resolved to Inter or Source Code Pro
- Attribution on quote ads always mono label, two lines (name / title + company)
- All CSS comes from the AI as inline style strings, parsed by `FreeformCanvas`

---

## 5. Generation Pipeline

```
AdForm → POST /api/generate → AI (Sonnet) → validate → judge panel (Haiku ×3) → stream result → render
```

**Route:** `POST /api/generate`
**Streams:** NDJSON (`status`, `result`, `error` events)

**Generation rules:**
- Target: 5 passing variants per generation
- Max rounds: 3
- Dynamic batch size per round: `max(2, target - passing.length)`
- Pass threshold: round 1 → 6.5, round 2 → 6.2, round 3 → 5.9 (softens to fill 5)
- Best-available fallback: if 3 rounds complete without 5 passing, surface the highest-scoring candidates
- Concept names must be unique within a batch (deduped before validation)
- All 3 themes must appear at least once across 5 variants
- At least 2 different background styles, at least one using `dot-grid` or `grid`

**Validation (server-side, structural only):**
- Logo present and ≥ 300px wide
- Headline present
- Position values within canvas bounds
- Font sizes meet minimums (body/CTA ≥ 30px)
- No collision estimation — collision detection is DOM-based post-render

**Judge panel:**
- 3 independent judges: Designer (CD), Taste Maker, Growth Hacker
- Each scores 4 dimensions (s1–s4), 1–10 each
- `overall` = average of 4 scores
- Pass if majority (2 of 3) judges pass
- Automatic fail (score = 0): duplicate composition logic, missing logo, missing user-provided input
- Model: `claude-haiku-4-5-20251001` (speed)

**Multi-generation:**
- Each generation run appends a new row of 5 below previous results
- Accumulates until page refresh
- History (persistent across sessions) stored in Supabase

---

## 6. Collision Detection

**Approach:** DOM-based, post-render. No server-side estimation.

**Mechanism:**
- 400ms after mount, `VariantCard` queries all `[data-slot]` elements
- Checks bounding rects for overlaps using `getBoundingClientRect`
- On collision: triggers `handleCollision(variantId)` in page
- `handleCollision` silently fetches one replacement variant
- Capped at 2 attempts per slot (tracked by `collisionAttemptsRef` keyed to `slotKey`)
- Replacement IDs use `slotKey` as base (e.g. `g1-v2-r{timestamp}`) to preserve attempt tracking

**Known limitation:** Colliding card is visible for ~400ms before replacement triggers. Acceptable for current use.

---

## 7. Vision Evaluation

After all 5 cards in a generation are rendered, each card captures a 540px PNG of itself and POSTs to `/api/evaluate`. The judge panel re-evaluates using the actual rendered image (not just the CSS spec).

- Capture: `html-to-image` `toPng` on the live `exportRef` element
- Scores (CD, Taste, Growth) displayed beneath each card
- Runs once per generation, after all images captured
- Does not trigger re-generation — display only

---

## 8. Export

**How it works:**
- User clicks **Export** on a variant card
- Export modal opens, showing available sizes
- User selects a size
- For 1:1: downloads immediately (already rendered at 1080×1080)
- For 4:5 or landscape: triggers on-demand reflow generation (~5–10s), shows preview, then downloads

**Export implementation:**
- Captures the live `exportRef` element (1080×1080, unscaled) using `html-to-image`
- `pixelRatio: 2` → 2160×2160px output
- Do NOT use off-screen clone — elements at large negative offsets render blank

**Platform sizes:**

| Label | Dimensions | Ratio | Platforms |
|---|---|---|---|
| Square | 1080×1080 | 1:1 | LinkedIn · X · Reddit |
| Portrait | 1080×1350 | 4:5 | LinkedIn |
| Landscape | 1200×627 | ~1.9:1 | LinkedIn · X · Reddit |

**Google Display** (728×90, 300×250, 336×280): deferred to Phase 2. Banner sizes require fundamentally different layout logic.

**Reflow:**
- On-demand only — triggered by user selecting a non-1:1 size in export modal
- Separate lightweight AI call — no judge panel, no rounds
- Same copy, same theme, same concept — new composition for target canvas shape
- Copy is never trimmed or altered for different sizes

---

## 9. Session History

**Storage:** Supabase

**What gets stored per session:**
- Timestamp, all generated variants (full data: CSS slots, copy, theme, scores), platform selection
- Feedback and ratings per variant (see §10)

**UI:**
- History view shows all past sessions, newest first
- Any user can view any session and re-export any variant
- Any user can delete any session (no confirmation gate beyond a simple "are you sure")
- No login, no user attribution on sessions

---

## 10. Human Feedback & Persistent Learning

**Goal:** Improve future AI generations based on what humans rate highly.

### Interaction model

- **👍 / 👎 on each variant card** — thumbs appear in top-right corner on hover. Tap fires immediately, no submit button.
- **Feedback panel** — clicking a thumb fades the ad and reveals a panel within the same card footprint (ad never grows taller). Panel shows:
  - Relevant tags (3 negative tags on 👎, 3 positive tags on 👍)
  - One optional free-text line: *"What should the AI do more / less of?"*
  - "Done" button — ad returns, small badge appears bottom-left (`👍 Liked` / `👎 Disliked`)
- Top-right thumbs only visible on hover; badge is the only persistent indicator after voting.
- Works identically in both the builder and the history panel.

### Tags

**Negative (shown on 👎):**

| Tag | What the AI reads in the data | What it changes |
|---|---|---|
| `Too Crowded` | High slot count, tight positioning, small font sizes | Fewer slots, larger type, more whitespace |
| `Weak Hierarchy` | Headline font-size close to body/CTA font-size | Exaggerate size contrast between elements |
| `Text Cut Off` | Slot position values near canvas edges, or overlapping slots | Keep elements away from borders, increase internal padding |

**Positive (shown on 👍):**

| Tag | What the AI reads in the data | What it reinforces |
|---|---|---|
| `Strong Hierarchy` | Large headline, significantly smaller secondary elements | Preserve this size ratio pattern |
| `Clean Layout` | Low slot count, generous spacing | Minimal working — don't add more elements |
| `Striking Composition` | Unusual or asymmetric slot positioning that scored well | Unconventional placement got approval — explore similar |

### Storage

Supabase `feedback` table. Each record: `variant_id`, `session_id`, `vote` (`up`/`down`), `tags` (array), `note` (text, nullable).

### AI learning loop (hybrid — no cron job required)

At generation time, `/api/generate` queries the DB live and injects:

1. **Positive few-shot examples** — top 5 👍 `variant_data` JSON objects injected verbatim as "these compositions worked well"
2. **Negative few-shot examples** — top 3 👎 `variant_data` JSON objects injected as "these were rated poorly — avoid similar patterns"
3. **Structural tag hints** — if any structural tag has 3+ votes, a specific directive is added:
   - `Too Crowded` ×3 → "Increase whitespace between slots, shrink secondary element font sizes, spread elements further apart — all user-provided fields must still appear"
   - `Weak Hierarchy` ×3 → "Exaggerate size contrast — headline should dominate strongly"
   - `Text Cut Off` ×3 → "Keep all elements well within canvas bounds. Elements should not clash with one another"
   - `Strong Hierarchy` ×3 → "Large dominant headline with much smaller secondary elements is working well"
   - `Clean Layout` ×3 → "Generous spacing and few competing elements are resonating — keep layouts open"
   - `Striking Composition` ×3 → "Unconventional asymmetric layouts are getting positive responses"
4. **Free text notes** — last 5 non-empty notes injected verbatim as "recent human feedback"

**No export signal** — export events are not used as implicit positive ratings. A user may test-export many variants, which would skew the data.

**No summarisation cron** — the loop reads live from DB on every generation. Always current, no background jobs.

**If the learning feels off:** Adjust the tag-to-directive mapping in `/api/generate` or raise/lower the vote threshold (currently 3). The full logic is in `app/api/generate/route.ts`. The `feedback` table in Supabase is the source of truth — you can inspect or delete records directly there.

---

## 11. Visual Reference System

**Purpose:** Curated reference images (Figma exports, inspiration ads, brand work) that influence the AI's creative direction at generation time.

**Storage:** Supabase Storage bucket (`/references`)

**Capacity:** Up to 50 images

**UI:** Lives at `/admin` — separate from the main builder, not linked prominently. Direct URL access only. Intentionally low-visibility so casual users don't stumble into it.
- Thumbnail grid of current reference images
- Drag + drop or file picker upload (no Supabase dashboard access needed)
- Delete button per image
- Status indicator: "Style rules last updated X mins ago"

**How it works:**
1. User uploads/removes images via `/admin` — written directly to Supabase Storage
2. Background job periodically scans the bucket for changes (new or removed images)
3. On change: re-extracts style rules from the full updated image set using AI vision
4. Extracted rules saved to a Supabase table, timestamped
5. `/api/generate` reads the latest extracted rules at generation time and injects them into the prompt
6. No manual trigger — fully automated end-to-end

**Current status:** Not yet built. This is a Phase 1 planned feature. The generation prompt currently has no reference-derived rules.

**Reference types:** Both external inspiration (competitor/peer ads, industry work) and internal Figma exports. All treated equally as style signal.

**Influence:** Always active in background — informs compositional tendencies, mood, texture, and visual ambition. References must never influence brand colors or typography — those are locked in the brand system. References shape *how* a design feels, not *what colors or fonts* it uses.

---

## 12. Data Contracts

**`AdInput`**
```typescript
type AdInput =
  | { adType: 'big-headline'; headline: string; body: string | null; cta: string | null; stat: string | null; statLabel: string | null; context: string | null }
  | { adType: 'quote'; quote: string; name: string | null; titleAndCompany: string | null; cta: string | null; context: string | null }
```

**`Variant`** (runtime — not sent to AI)
```typescript
type Variant = {
  id: string           // e.g. "g1-v2", "g1-v2-r1234567"
  concept: string
  theme: 'dark' | 'light' | 'tonal'
  background: string
  reasoning: string
  logo: string         // CSS inline style string
  headline: string
  body: string
  eyebrow: string
  cta: string
  input: AdInput       // stripped before sending to judge panel
  evaluation?: Evaluation
}
```

**`Platform sizes`**

| Key | Width | Height |
|---|---|---|
| `square` | 1080 | 1080 |
| `portrait` | 1080 | 1350 |
| `landscape` | 1200 | 627 |

---

## 13. File Structure

```
app/
  page.tsx              — main builder page, generation + collision state
  page.css              — builder layout styles
  layout.tsx            — root layout, font loading (Inter + Source Code Pro)
  globals.css           — CSS custom properties, theme tokens
  templates.css         — ad canvas themes + background classes
  api/
    generate/route.ts   — generation pipeline, judge loop, NDJSON streaming
    evaluate/route.ts   — vision evaluation endpoint

components/
  AdForm.tsx            — copy input form
  AdRenderer.tsx        — ad canvas wrapper, theme + background class resolver
  FreeformCanvas.tsx    — renders AI CSS slots, font normalization, data-slot attrs
  VariantCard.tsx       — card wrapper, collision detection, vision capture, export trigger
  VariantGrid.tsx       — 5-card grid layout
  ExportModal.tsx       — size picker, reflow trigger, download
  ThemeToggle.tsx       — dark/light UI toggle

lib/
  types.ts              — Variant, AdInput, Platform types + toLayout() helper
  constants.ts          — PLATFORM_SIZES, PLATFORM_LABELS
  validate.ts           — structural validation (no collision estimation)
  evaluate.ts           — judge panel logic
  export.ts             — html-to-image capture

docs/
  generation-guidelines.md   — AI creative brief (loaded into generate prompt)
  acceptance-criteria.md     — judge evaluation rubric (loaded into evaluate prompt)
```

---

## 14. Phases

### Phase 1 — Current
- Big headline + quote ad types
- 5-variant generation with 3-judge panel
- Multi-generation accumulation
- DOM collision detection + silent replacement
- Vision scoring display
- Export: 1:1 immediate, 4:5 + landscape on-demand reflow
- Session history in Supabase
- Human feedback (rating + tags)
- Visual reference system (Supabase Storage → auto re-extraction)

### Phase 2
- Product screenshot ad type (user-uploaded image, AI-composed layout)
- Event ad type (title, date, time, speaker)
- Google Display export sizes (728×90, 300×250, 336×280)
- Feedback dashboard (aggregate view of ratings + tag trends)
- AI-generated stylized product UI representations

---

## 15. Invariants

These must always be true. If a change would break any of these, it is a bug — stop and fix the root cause.

1. Every generation produces exactly 5 variants (best-available fallback ensures this even if rounds exhaust)
2. Every user-provided input field appears in every variant — no exceptions
3. All 3 themes appear at least once across 5 variants
4. Logo is always present and ≥ 300px wide
5. Body and CTA font sizes are always ≥ 30px
6. Export always captures the live 1080×1080 element — never an off-screen clone
7. Collision attempt counter is always keyed to `slotKey` (not raw variant ID) — replacement chains share the same counter
8. The completed-generations render loop always renders `<VariantGrid>` — without it, cards are never mounted and export is non-functional
9. Font family in rendered ads is always Inter or Source Code Pro — never a system serif or unknown font
