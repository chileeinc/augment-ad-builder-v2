# Augment Ad Builder v2

Internal tool for Augment's marketing and growth team to generate, evaluate, and export on-brand social ads using AI.

**Stack:** Next.js 15 App Router · Vercel AI SDK · Anthropic Claude · Supabase · html-to-image

---

## What it does

1. Enter copy (headline, body, stat, CTA) and select platforms
2. AI generates 5 compositionally distinct ad variants
3. A panel of 3 AI judges evaluates every design — only passing ones surface
4. Rate variants with thumbs up/down and written notes
5. The AI learns from your ratings and improves future generations automatically
6. Preview at target platform size, export as PNG

---

## Getting started

```bash
cd "2- Tools/tool-ad-builder-v2"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Required environment variables** (`.env.local`):

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Changelog

### 2026-04-06 — Human Feedback + AI Learning Loop (M3)

- **Thumbs up/down on every ad card** — hover to reveal, tap to vote instantly
- **Feedback panel** — overlays the ad with tag chips and a free-text note field. Tags: `Too Crowded`, `Weak Hierarchy`, `Text Cut Off` (negative) and `Strong Hierarchy`, `Clean Layout`, `Striking Composition` (positive)
- **Feedback persists** — voted badge shows bottom-left; re-clicking your thumb reopens the panel showing what you wrote
- **AI learns in real time** — every new generation reads the feedback DB and injects: top 5 liked variant layouts as positive examples, top 3 disliked as negative examples, tag directives once any tag hits 3+ votes, and your last 5 written notes verbatim
- **Debug endpoint** — `GET /api/debug/feedback-context` shows exactly what's in the DB and what will be injected on the next generation

### 2026-04-06 — Session History (M2)

- **Slide-in history panel** — accessible via History button, overlays the builder without losing current work
- **All sessions and generations saved** — every generation run is persisted to Supabase; history shows all rows per session
- **Collision replacement patches history** — when a colliding ad is auto-replaced, the DB is updated so history shows the fixed version, not the original
- **Re-export from history** — any past variant can be exported at any size

### 2026-04-05 — Core Builder (M1)

- **Two ad types** — Big Headline (stat-driven) and Quote (attribution required)
- **AI generation pipeline** — Claude Sonnet generates layouts; 3-judge panel (Creative Director, Taste Maker, Growth Hacker) evaluates and filters; up to 3 rounds with softening thresholds
- **DOM collision detection** — overlapping text elements trigger silent auto-replacement, capped at 2 attempts per slot; skeleton overlay shows during replacement
- **Vision scoring** — after all 5 cards render, each is captured as a 540px PNG and re-evaluated by the judge panel; scores displayed per card
- **Export** — 1:1 PNG at 2× pixel ratio (2160×2160px output)
- **Light/dark UI toggle**
- **Multi-generation** — each Generate run appends a new row of 5 below previous results

---

## Key files

| File | Purpose |
|---|---|
| `SPEC.md` | Full product spec — invariants, data contracts, all system behaviour |
| `PLAN.md` | Build plan and milestone status |
| `docs/generation-guidelines.md` | AI creative brief injected into every generation |
| `docs/acceptance-criteria.md` | Judge panel evaluation rubric |
| `app/api/generate/route.ts` | Generation pipeline — rounds, validation, judge loop, feedback context |
| `app/api/feedback/route.ts` | Saves thumbs/tags/notes to Supabase |
| `app/api/debug/feedback-context/route.ts` | Health check — shows what's in the feedback DB |
| `components/FeedbackOverlay.tsx` | Self-contained feedback UI per card |
| `components/HistoryPanel.tsx` | Slide-in history panel |
