# tool-ad-builder-v2

## Source of Truth
Read `SPEC.md` before doing any work in this project. It defines what this tool is, how it works, all data contracts, and the 9 invariants that must always hold. If something you're about to build contradicts the spec, flag it — don't just build it.

## Session Continuity
If `HANDOFF.md` exists in this folder, read it before doing anything else.

## Project
AI-powered ad builder. User types a prompt → picks platforms → gets 5 AI-generated ad variants → exports as PNG.

## Stack
Next.js 15 App Router, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), Zod, `html-to-image`, CSS custom properties (no Tailwind).

## Design Tokens
Defined in `app/templates.css`. Three themes: `dark`, `light`, `tonal`. Follow `augment-design-spec.md` in the parent repo for brand colours.

## Repo
https://github.com/chileeinc/augment-ad-builder-v2

## Engineering Philosophy
When a new problem surfaces, resist the instinct to patch it with a new rule, flag, or layer. Ask: what is the root cause, and what is the most minimal fix that handles it at the source? The goal is a system that stays lean and doesn't accumulate workarounds. More rules and more checks compound over time — prefer solutions that are structural, not additive. If you find yourself adding to acceptance criteria, prompts, or validation for every new edge case, stop and look for the broader fix.

## Tribal Knowledge
- `lib/export.ts`: Do NOT use the off-screen clone approach for html-to-image. Elements positioned at large negative offsets (e.g. top: -99999px) render blank. Capture the live element directly — it's already 1080×1080 in the DOM (just CSS-scaled by its parent). Vision eval uses the same element and proves it works.
- `app/page.tsx handleCollision`: The replacement ID must use `slotKey` as its base (not the API's raw variant ID). If you use the raw ID, the attempt counter resets on each replacement and the 2-attempt cap never triggers, causing infinite swaps.
- `app/page.tsx`: The completed-generations render loop MUST include `<VariantGrid>`. Without it, ads are never mounted and export is non-functional.
- `app/templates.css` (formerly `templates/templates.css`): Imported by AdRenderer. Contains all theme + background CSS classes used by the ad canvas.

## Decisions
- 2026-04-02: Removed clone approach from export — live element capture is simpler and proven to work by vision eval path
- 2026-04-02: Collision replacement ID uses `slotKey` base to preserve attempt tracking across full replacement chain
- 2026-04-02: Moved templates.css to app/ — no reason for a separate templates/ folder with one file
- 2026-04-02: Deleted docs/superpowers/ — stale planning docs from build phase, not useful going forward

## Debt Register
- lib/export.test.ts: calls old 4-arg exportAdElement signature — test will fail. Update or delete. — 2026-04-02
- Collision swap is still visible to user (reactive DOM-check model requires rendering before detecting). Per-card skeleton during replacement would improve UX — deferred. — 2026-04-02

## Churn Map
- app/page.tsx: touched heavily across multiple sessions — multi-generation refactor, collision logic, render loop bug
- lib/export.ts: touched 3+ times — clone approach tried, broken, simplified back to direct capture
- components/FreeformCanvas.tsx: touched multiple times — font normalization, attribution layout, data-slot attributes
