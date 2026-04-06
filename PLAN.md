# Augment Ad Builder v2 — Build Plan

**Read alongside:** `SPEC.md` (what it is) and `HANDOFF.md` (last session detail)
**How to use:** Work top to bottom. Check off tasks as completed. Never skip a milestone — each builds on the one before.

---

## Current Status

**Working today:**
- ✅ Ad form (big-headline + quote)
- ✅ AI generation with 3-judge panel
- ✅ Multi-generation accumulation (rows of 5)
- ✅ DOM collision detection + silent replacement (capped)
- ✅ Vision scoring display (CD / Taste / Growth)
- ✅ Export — 1:1 PNG (fixed, live element capture)
- ✅ Light/dark UI toggle

**Known debt (non-blocking):**
- `lib/export.test.ts` calls old 4-arg signature — will fail if run. Update or delete.
- Collision swap briefly visible to user (reactive model — acceptable for now)

---

## Milestone 1 — Database Foundation
*Everything else depends on this. Do this first.*

- [x] Confirm Supabase project credentials are in `.env.local`
- [x] Create `sessions` table — `id`, `created_at`, `platform_selection`, `ad_type`
- [x] Create `variants` table — `id`, `session_id`, `generation_index`, `variant_data` (full JSON: CSS slots, copy, theme, scores), `created_at`
- [x] Create `feedback` table — `id`, `variant_id`, `session_id`, `rating` (1–5), `tags` (array), `note` (text, nullable), `created_at`
- [x] Create `reference_rules` table — `id`, `extracted_rules` (text), `image_count`, `updated_at`
- [x] Write and run migrations
- [x] Add Supabase client to `lib/supabase.ts`
- [x] Verify connection works from the app

---

## Milestone 2 — Session History
*Depends on: Milestone 1*

**Save sessions:**
- [ ] On generation complete, save session + all 5 variants to Supabase
- [ ] Each variant stores full JSON (all CSS, copy, theme, evaluation scores)
- [ ] Session stores platform selection + ad type + timestamp

**History page (`/history`):**
- [ ] List all sessions, newest first
- [ ] Each session shows: timestamp, ad type, thumbnail row of variant images (use captured vision eval images)
- [ ] Click session → expands to show all 5 variant cards, re-renderable from stored JSON
- [ ] Re-export works on historical variants (same export flow as main builder)
- [ ] Delete session button — "are you sure?" confirmation — deletes session + its variants + feedback

---

## Milestone 3 — Human Feedback
*Depends on: Milestone 1 + 2 (variants must be stored to attach feedback to)*

**Per-card feedback UI:**
- [ ] Star rating (1–5) below each variant card — visible in both builder and history views
- [ ] Tag picker: `Too crowded` · `Weak hierarchy` · `Off-brand` · `Good layout` · `Good vibe` · `Too safe`
- [ ] Optional free text field (collapsed by default, expandable)
- [ ] Submit saves to `feedback` table in Supabase, linked to `variant_id`
- [ ] Submitted state persists — if user comes back to history, their rating is still shown

---

## Milestone 4 — Platform Reflow
*Depends on: nothing from above — can be done independently, but do it after M1–3 to keep focus*

**Export modal update:**
- [ ] Replace current flat platform list with size-grouped buttons:
  - Square 1080×1080 (LinkedIn · X · Reddit) — downloads immediately
  - Portrait 1080×1350 (LinkedIn) — triggers reflow
  - Landscape 1200×627 (LinkedIn · X · Reddit) — triggers reflow
- [ ] For reflow sizes: show "Generating preview…" spinner in modal
- [ ] New lightweight API call: POST `/api/reflow` — takes variant data + target dimensions, returns a single recomposed variant (no judge panel, no rounds)
- [ ] Show reflow preview in modal before download
- [ ] User can regenerate reflow ("try again") or download

---

## Milestone 5 — Visual Reference System
*Depends on: Milestone 1 (needs `reference_rules` table)*

**`/admin` page:**
- [ ] Not linked from main nav — direct URL only (`/admin`)
- [ ] Thumbnail grid of current reference images from Supabase Storage
- [ ] Upload via drag + drop or file picker (writes to Supabase Storage `/references` bucket)
- [ ] Delete per image
- [ ] Status line: "Style rules last updated X mins ago" (reads from `reference_rules` table)

**Extraction pipeline:**
- [ ] Background job (Supabase Edge Function or cron): runs every 10 mins, checks if Storage bucket has changed since last extraction
- [ ] On change: sends all reference images to AI vision (Sonnet), extracts style rules (composition tendencies, moods, textures — never colors or typography)
- [ ] Saves extracted rules to `reference_rules` table with timestamp
- [ ] `/api/generate` reads latest `reference_rules` row and injects into system prompt

---

## Milestone 6 — Feedback Learning
*Depends on: Milestone 3 (needs feedback data to summarize)*

**Learning pipeline:**
- [ ] Background job: periodically summarizes feedback data — high-rated patterns become positive guidance, low-rated patterns become anti-patterns
- [ ] Summaries stored in a `feedback_rules` table (similar to `reference_rules`)
- [ ] `/api/generate` injects feedback-derived guidance alongside reference rules

**Dashboard (`/admin` — add a tab or section):**
- [ ] Aggregate view: average rating per tag, most common tags, highest/lowest rated variants
- [ ] Human-readable — designed for a non-technical marketer to review trends

---

## Milestone 7 — Debt Cleanup
*Do this whenever there's a natural gap between milestones*

- [ ] Delete or update `lib/export.test.ts` (calls old 4-arg signature)
- [ ] Delete or update `components/AdRenderer.test.tsx` (stale)
- [ ] Delete or update `lib/types.test.ts` (stale Variant shape)
- [ ] Add per-card loading skeleton during collision replacement (deferred UX improvement)

---

## Phase 2 — Future (not sequenced yet)

- Product screenshot ad type
- Event ad type
- Google Display export sizes
- AI-generated stylized product UI representations
- Feedback dashboard advanced analytics
