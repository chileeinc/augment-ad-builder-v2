# tool-ad-builder-v2

## Session Continuity
If `CONTINUE.md` exists in this folder, read it before doing anything else.

## Project
AI-powered ad builder. User types a prompt → picks platforms → gets 5 AI-generated ad variants → exports as PNG.

## Key Docs
- Spec: `docs/superpowers/specs/2026-04-01-ai-ad-builder-design.md`
- Plan: `docs/superpowers/plans/2026-04-01-mvp-implementation.md`

## Stack
Next.js 15 App Router, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), Zod, `html-to-image`, CSS custom properties (no Tailwind).

## Design Tokens
Defined in `templates/templates.css`. Three themes: `dark`, `light`, `tonal`. Follow `augment-design-spec.md` in the parent repo for brand colours.

## Repo
https://github.com/chileeinc/augment-ad-builder-v2
