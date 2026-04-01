# Continue — 2026-04-01

## Current Goal
Build the AI Ad Builder v2 — a Next.js 15 app where a user types a prompt, picks platforms, and gets 5 AI-generated ad variants they can export as PNG.

## Where We Left Off
Wrote the full MVP implementation plan. The plan is saved at `2- Tools/tool-ad-builder-v2/docs/superpowers/plans/2026-04-01-mvp-implementation.md`. The project folder exists but no code has been written yet — only docs and specs.

## Next Steps
1. Choose execution approach: **Subagent-Driven** (dispatch fresh subagent per task) or **Inline** (execute in session). User was asked but hadn't answered before session-continue ran.
2. Start at Task 1 of the plan: scaffold Next.js 15 inside `2- Tools/tool-ad-builder-v2/`
3. Work through all 12 tasks in order to reach a working Vercel deploy

## Active Files
- `2- Tools/tool-ad-builder-v2/docs/superpowers/plans/2026-04-01-mvp-implementation.md` — implementation plan, 12 tasks, all code written out
- `2- Tools/tool-ad-builder-v2/docs/superpowers/specs/2026-04-01-ai-ad-builder-design.md` — full product spec (stack updated to Next.js 15 + Vercel AI SDK)

## Decisions Made This Session
- Framework: Next.js 15 App Router (not Vite) — keeps Anthropic key server-side, enables Vercel deploy
- AI streaming: Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) + `generateObject`
- Export: `html-to-image` (already validated in v1)
- Supabase: new project to be created, deferred to Plan 2
- MVP templates: BigTypeBody, StatHero, CustomerQuote only (line-editorial + illustration deferred)
- GitHub repo: `github.com/chileeinc/augment-ad-builder-v2`
- Execution method: **not yet chosen** — ask user at start of next session

## Open Questions / Blockers
- User needs to choose: Subagent-Driven vs Inline execution
- Anthropic API key needed in `.env.local` before Task 7 smoke test
