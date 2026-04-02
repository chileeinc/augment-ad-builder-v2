# Continue — 2026-04-02

## Current Goal
Build a generative AI ad system where the AI invents compositions freely (not picks from templates), evaluated by a panel of three design judges before surfacing results.

## Where We Left Off
Created `principles.md` and `acceptance-criteria.md`. Wired `principles.md` + `generation-guidelines.md` as the concatenated system prompt in `route.ts`. Uncommitted changes in branch `feat/generative-ai-builder`.

## Next Steps
1. Commit the uncommitted changes (route.ts, FreeformCanvas, types, guidelines, principles, acceptance-criteria)
2. Build the `/api/evaluate` route — reads `acceptance-criteria.md`, scores the 5 variants using 3 judges, returns pass/fail per design
3. Wire evaluate into the frontend — call generate → evaluate → show only passing designs
4. Test the full pipeline end to end

## Active Files
- `app/api/generate/route.ts` — system prompt now loads principles + guidelines; schema uses flat CSS strings
- `components/FreeformCanvas.tsx` — parses AI CSS strings into React inline styles
- `lib/types.ts` — GeneratedLayout uses flat CSS strings per element
- `docs/principles.md` — 10 governing creative principles (new)
- `docs/acceptance-criteria.md` — 3-judge panel: The Designer, The Taste Maker, The Growth Hacker (new)
- `docs/generation-guidelines.md` — technical spec for AI output format (kept, loaded after principles)

## Decisions Made This Session
- Replaced 3 hardcoded templates with freeform AI-authored layouts (AI outputs CSS strings)
- Schema uses flat CSS strings per element to stay under Anthropic's 24 optional param limit
- 3-judge acceptance panel: majority (2/3) required to pass; 6.5 threshold per judge
- `principles.md` loads before `generation-guidelines.md` in system prompt

## Open Questions / Blockers
- Evaluate route not yet built — designs are generated but not judged
- Font loading (Source Code Pro for eyebrow/mono elements) not yet confirmed in production
