# Augment Ad Builder v2 — Build Plan

**Read alongside:** `SPEC.md` (what it is) and `HANDOFF.md` (last session detail)
**How to use:** Work top to bottom. Check off tasks as completed. Never skip a milestone — each builds on the one before.

---

## Current Status

**Working today:**
- ✅ Ad form (big-headline + quote)
- ✅ AI generation with 3-judge panel
- ✅ Multi-generation accumulation (rows of 5)
- ✅ DOM collision detection + skeleton overlay during replacement
- ✅ Collision replacement patches DB so history shows the fixed variant
- ✅ Vision scoring display (CD / Taste / Growth)
- ✅ Export — 1:1 PNG (fixed, live element capture)
- ✅ Light/dark UI toggle
- ✅ Session history — slide-in panel, all generations shown, delete
- ✅ Human feedback — 👍/👎 per card, tags, free-text notes, badge persists
- ✅ Feedback persists across sessions — history panel pre-populates badges
- ✅ AI learning loop — live DB read on every generation, 16 feedback records confirmed active
- ✅ `/api/debug/feedback-context` — internal health check endpoint

**Known debt (non-blocking):**
- `lib/export.test.ts` calls old 4-arg signature — will fail if run. Update or delete.
- Delete session button missing confirmation gate (listed in M2 below — still open)

---

## Milestone 1 — Database Foundation ✅

- [x] Supabase credentials in `.env.local`
- [x] `sessions` table
- [x] `variants` table
- [x] `feedback` table — `vote` (up/down), `tags`, `note`, unique constraint on `variant_id`
- [x] `reference_rules` table
- [x] `lib/supabase.ts` with browser client + `getSupabaseAdmin()` function

---

## Milestone 2 — Session History ✅
*One item still open.*

- [x] Save session + variants on generation complete
- [x] All generations within a session saved (multi-generation support)
- [x] History panel — slide-in, all sessions newest first, all generations shown
- [x] Re-export from history works
- [ ] Delete session — needs "are you sure?" confirmation gate

---

## Milestone 3 — Human Feedback + AI Learning Loop ✅

- [x] `feedback` table migrated: `vote text` ('up'/'down'), `tags[]`, `note`
- [x] 👍/👎 thumbs on each card, visible on hover
- [x] Feedback panel overlays ad canvas within card footprint
- [x] 👎 tags: `Too Crowded` · `Weak Hierarchy` · `Text Cut Off`
- [x] 👍 tags: `Strong Hierarchy` · `Clean Layout` · `Striking Composition`
- [x] Tags save on tap, note saves on blur, badge shows bottom-left after Done
- [x] Re-clicking own thumb reopens panel showing existing feedback
- [x] Feedback persists in history — badges pre-populated from DB
- [x] `/api/generate` injects top 5 👍 as positive few-shot examples
- [x] `/api/generate` injects top 3 👎 as negative few-shot examples
- [x] Tag directives injected at 3+ votes (confirmed: `Text Cut Off`, `Strong Hierarchy`, `Clean Layout` all active)
- [x] Last 5 free-text notes injected verbatim (5 detailed notes confirmed in DB)

---

## Milestone 4 — Platform Reflow
*Depends on: nothing from above — can be done independently*

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

## Milestone 6 — Feedback Dashboard
*Depends on: Milestone 3 (needs real feedback data)*

**Dashboard (tab in `/admin` or standalone `/admin/feedback`):**
- [ ] Vote counts per tag (bar chart or table)
- [ ] Most common tags on 👍 vs 👎 variants
- [ ] Recent free-text notes (last 20, newest first)
- [ ] Human-readable — designed for a non-technical marketer

---

## Milestone 7 — Debt Cleanup
*Do this whenever there's a natural gap between milestones*

- [ ] Delete or update `lib/export.test.ts` (calls old 4-arg signature)
- [ ] Delete or update `components/AdRenderer.test.tsx` (stale)
- [ ] Delete or update `lib/types.test.ts` (stale Variant shape)
- [ ] Add delete confirmation gate to history panel (from M2)

---

## Phase 2 — Future (not sequenced yet)

- Product screenshot ad type
- Event ad type
- Google Display export sizes
- AI-generated stylized product UI representations
- Feedback dashboard advanced analytics
