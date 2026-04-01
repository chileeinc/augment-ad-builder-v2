# AI Ad Builder v2 — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app where a user types a prompt, picks platforms, and gets 5 AI-generated ad variants they can export as PNG.

**Architecture:** Next.js 15 App Router with a single `/api/generate` route that calls Claude server-side (key never exposed to client). Ad templates are React client components using CSS custom properties for theming. Export uses `html-to-image` in the browser.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), Zod, `html-to-image`, CSS custom properties (no Tailwind)

**Spec:** `docs/superpowers/specs/2026-04-01-ai-ad-builder-design.md`

---

## File Map

```
tool-ad-builder-v2/
├── app/
│   ├── layout.tsx              # Root layout — fonts, global CSS
│   ├── page.tsx                # Builder page (prompt → variants → export)
│   ├── globals.css             # Font vars, reset, body styles
│   └── api/generate/
│       └── route.ts            # POST — Claude call, returns 5 variants
├── components/
│   ├── AugmentLogo.tsx         # SVG wordmark, currentColor fill
│   ├── AdRenderer.tsx          # Picks template by layout, applies theme/bg classes
│   ├── PromptInput.tsx         # Textarea + platform checkboxes + Generate button
│   ├── VariantGrid.tsx         # 5-up grid, loading skeleton
│   ├── VariantCard.tsx         # Single variant display + Export button
│   └── ExportModal.tsx         # Size picker + download per size
├── templates/
│   ├── templates.css           # Shared: .ad-canvas, theme-*, bg-*
│   ├── BigTypeBody.tsx         # Layout: large headline, logo, optional CTA
│   ├── BigTypeBody.css
│   ├── StatHero.tsx            # Layout: big stat, headline, logo, optional CTA
│   ├── StatHero.css
│   ├── CustomerQuote.tsx       # Layout: pull quote, attribution, logo
│   └── CustomerQuote.css
└── lib/
    ├── types.ts                # Variant, Platform, Theme, Layout, etc.
    ├── constants.ts            # PLATFORM_SIZES, PLATFORM_LABELS
    └── export.ts               # toPng wrapper with font-ready guard
```

---

## Task 1: Scaffold Next.js 15 project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Initialize project inside the existing folder**

```bash
cd "/Users/chilee-old/Documents/Development/augment-projects/Augment/2- Tools/tool-ad-builder-v2"
npx create-next-app@latest . --typescript --eslint --no-tailwind --no-src-dir --app --no-turbopack --import-alias "@/*"
```

When prompted, answer:
- Would you like to use Tailwind CSS? → **No**
- Would you like your code inside a `src/` directory? → **No**

- [ ] **Step 2: Install additional dependencies**

```bash
cd "/Users/chilee-old/Documents/Development/augment-projects/Augment/2- Tools/tool-ad-builder-v2"
npm install ai @ai-sdk/anthropic zod html-to-image
```

- [ ] **Step 3: Verify package.json has these deps**

Expected `dependencies` section:
```json
{
  "ai": "^4.x.x",
  "@ai-sdk/anthropic": "^1.x.x",
  "zod": "^3.x.x",
  "html-to-image": "^1.x.x",
  "next": "15.x.x",
  "react": "^19.x.x",
  "react-dom": "^19.x.x"
}
```

Run: `npm list ai @ai-sdk/anthropic zod html-to-image`
Expected: all four packages listed with versions

- [ ] **Step 4: Create `.env.local.example`**

```bash
# Copy to .env.local and fill in your key
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 5: Create `.env.local` with your actual key**

```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

- [ ] **Step 6: Update `.gitignore` to ensure `.env.local` is excluded**

Verify `.gitignore` contains `.env.local` (create-next-app adds this by default).

Run: `grep ".env.local" .gitignore`
Expected: `.env.local`

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000`
Open `http://localhost:3000` — should show default Next.js page.
Stop server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 15 project"
git branch -M main
git remote add origin https://github.com/chileeinc/augment-ad-builder-v2.git
git push -u origin main
```

---

## Task 2: Shared types + constants

**Files:**
- Create: `lib/types.ts`
- Create: `lib/constants.ts`
- Test: `lib/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { PLATFORM_SIZES } from './constants'
import type { Variant, Platform } from './types'

describe('PLATFORM_SIZES', () => {
  it('has an entry for every platform', () => {
    const platforms: Platform[] = ['linkedin', 'instagram', 'twitter', 'reddit', 'google-display']
    for (const p of platforms) {
      expect(PLATFORM_SIZES[p]).toBeDefined()
      expect(PLATFORM_SIZES[p].length).toBeGreaterThan(0)
    }
  })

  it('each size has positive width and height', () => {
    for (const sizes of Object.values(PLATFORM_SIZES)) {
      for (const size of sizes) {
        expect(size.width).toBeGreaterThan(0)
        expect(size.height).toBeGreaterThan(0)
        expect(size.label).toBeTruthy()
      }
    }
  })
})

describe('Variant shape', () => {
  it('accepts a valid variant object', () => {
    const v: Variant = {
      id: 'v1',
      layout: 'stat-hero',
      theme: 'dark',
      background: 'dot-grid',
      copy_angle: 'metric-led',
      headline: '10% faster. Every dev.',
      cta: 'Try free →',
      stat: '10%',
      stat_label: 'faster dev speed',
      reasoning: 'Stat-led for LinkedIn feed impact'
    }
    expect(v.id).toBe('v1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/types.test.ts
```
Expected: FAIL — `Cannot find module './constants'`

- [ ] **Step 3: Create `lib/types.ts`**

```typescript
export type Theme = 'dark' | 'light' | 'tonal'
export type Background = 'none' | 'dot-grid' | 'grid'
export type Layout = 'big-type-body' | 'stat-hero' | 'customer-quote'
export type CopyAngle = 'metric-led' | 'benefit' | 'bold-claim' | 'brand-awareness'
export type Platform = 'linkedin' | 'instagram' | 'twitter' | 'reddit' | 'google-display'

export interface Variant {
  id: string
  layout: Layout
  theme: Theme
  background: Background
  copy_angle: CopyAngle
  headline: string
  cta: string | null
  stat: string | null
  stat_label: string | null
  reasoning: string
}

export interface GenerateRequest {
  prompt: string
  platforms: Platform[]
}
```

- [ ] **Step 4: Create `lib/constants.ts`**

```typescript
import type { Platform } from './types'

export interface AdSize {
  width: number
  height: number
  label: string
}

export const PLATFORM_SIZES: Record<Platform, AdSize[]> = {
  linkedin: [
    { width: 1200, height: 627, label: '1200×627' },
    { width: 1080, height: 1080, label: '1080×1080' }
  ],
  instagram: [
    { width: 1080, height: 1080, label: '1080×1080' },
    { width: 1080, height: 1350, label: '1080×1350' }
  ],
  twitter: [
    { width: 1200, height: 675, label: '1200×675' },
    { width: 1080, height: 1080, label: '1080×1080' }
  ],
  reddit: [
    { width: 1200, height: 628, label: '1200×628' }
  ],
  'google-display': [
    { width: 300, height: 250, label: '300×250' },
    { width: 728, height: 90, label: '728×90' },
    { width: 160, height: 600, label: '160×600' },
    { width: 300, height: 600, label: '300×600' }
  ]
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  reddit: 'Reddit',
  'google-display': 'Google Display'
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run lib/types.test.ts
```
Expected: PASS — 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/constants.ts lib/types.test.ts
git commit -m "feat: add shared types and platform constants"
```

---

## Task 3: Global CSS + design tokens

**Files:**
- Modify: `app/globals.css`
- Create: `templates/templates.css`

- [ ] **Step 1: Replace `app/globals.css` with this**

```css
/* ── Font variables ── */
:root {
  --font-sans: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0a0a0b;
  color: #f5f5f7;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Create `templates/templates.css`**

```css
/* ── Ad canvas base ── */
.ad-canvas {
  position: relative;
  overflow: hidden;
  font-family: var(--font-sans);
  container-type: size;
}

/* ── Theme: Dark ── */
.theme-dark {
  --ad-bg: #0a0a0b;
  --ad-fg: #f5f5f7;
  --ad-fg-muted: #888888;
  --ad-fg-dim: #555555;
  --ad-accent: #1AA049;
  --ad-cta-text: #ffffff;
  --ad-border: #1e1e26;
  --ad-border-subtle: #2a2a35;
  background-color: var(--ad-bg);
  color: var(--ad-fg);
}

/* ── Theme: Light ── */
.theme-light {
  --ad-bg: #ffffff;
  --ad-fg: #111111;
  --ad-fg-muted: #666666;
  --ad-fg-dim: #999999;
  --ad-accent: #1AA049;
  --ad-cta-text: #ffffff;
  --ad-border: #e5e5e7;
  --ad-border-subtle: #d0d0d4;
  background-color: var(--ad-bg);
  color: var(--ad-fg);
}

/* ── Theme: Tonal ── */
/* bg: augment-700 (#002400), fg: augment-200 (#99F7A9) */
.theme-tonal {
  --ad-bg: #002400;
  --ad-fg: #99F7A9;
  --ad-fg-muted: #5CCC76;
  --ad-fg-dim: #1a3a1a;
  --ad-accent: #99F7A9;
  --ad-cta-text: #002400;
  --ad-border: #1a3a1a;
  --ad-border-subtle: #0d2a0d;
  background-color: var(--ad-bg);
  color: var(--ad-fg);
}

/* ── Background: Dot Grid ── */
.bg-dot-grid.theme-dark {
  background-image: radial-gradient(circle, #2a2a35 1px, transparent 1px);
  background-size: 7px 7px;
}
.bg-dot-grid.theme-light {
  background-image: radial-gradient(circle, #f0f0f4 1px, transparent 1px);
  background-size: 7px 7px;
}
.bg-dot-grid.theme-tonal {
  background-image: radial-gradient(circle, #0d2e0d 1px, transparent 1px);
  background-size: 7px 7px;
}

/* ── Background: Grid ── */
.bg-grid.theme-dark {
  background-image:
    linear-gradient(to right, #1e1e26 1px, transparent 1px),
    linear-gradient(to bottom, #1e1e26 1px, transparent 1px);
  background-size: 8px 8px;
}
.bg-grid.theme-light {
  background-image:
    linear-gradient(to right, #f2f2f5 1px, transparent 1px),
    linear-gradient(to bottom, #f2f2f5 1px, transparent 1px);
  background-size: 8px 8px;
}
.bg-grid.theme-tonal {
  background-image:
    linear-gradient(to right, #0a2a0a 1px, transparent 1px),
    linear-gradient(to bottom, #0a2a0a 1px, transparent 1px);
  background-size: 8px 8px;
}
```

- [ ] **Step 3: Verify dev server still starts without errors**

```bash
npm run dev
```
Expected: no CSS errors in terminal. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css templates/templates.css
git commit -m "feat: add global CSS and design tokens"
```

---

## Task 4: AugmentLogo component

**Files:**
- Create: `components/AugmentLogo.tsx`

- [ ] **Step 1: Create `components/AugmentLogo.tsx`**

```tsx
interface Props {
  color?: string
  className?: string
}

export default function AugmentLogo({ color = 'currentColor', className }: Props) {
  return (
    <svg
      viewBox="0 0 1019 204"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <path d="M948.889 113.21C949.558 131.978 963.262 141.038 976.631 141.038C990.001 141.038 997.354 135.213 1001.2 126.638H1016.91C1012.73 141.685 998.524 153.981 976.631 153.981C948.221 153.981 932.512 134.243 932.512 108.518C932.512 81.0132 951.563 63.3779 976.13 63.3779C1003.54 63.3779 1020.08 85.7052 1018.08 113.21H948.889ZM949.057 100.59H1002.03C1001.7 88.2938 992.173 75.9977 976.13 75.9977C962.593 75.9977 950.393 83.1165 949.057 100.59Z" fill={color}/>
      <path d="M907.433 34.5801H922.64V151.879H907.433V138.774C901.918 147.996 892.392 153.982 878.02 153.982C857.464 153.982 839.582 137.479 839.582 108.681C839.582 80.0435 857.464 63.3789 878.02 63.3789C892.392 63.3789 901.918 69.3652 907.433 78.5873V34.5801ZM881.864 75.9987C866.322 75.9987 856.127 87.9712 856.127 108.681C856.127 129.39 866.322 141.362 881.864 141.362C895.4 141.362 908.101 131.655 908.101 108.681C908.101 85.7062 895.4 75.9987 881.864 75.9987Z" fill={color}/>
      <path d="M834.21 108.68C834.21 140.229 811.984 153.981 791.094 153.981C770.204 153.981 747.977 140.229 747.977 108.68C747.977 77.1302 770.204 63.3779 791.094 63.3779C811.984 63.3779 834.21 77.1302 834.21 108.68ZM791.094 141.038C804.797 141.038 818 131.007 818 108.68C818 85.5434 804.797 76.3213 791.094 76.3213C777.39 76.3213 764.188 84.8962 764.188 108.68C764.188 131.816 777.39 141.038 791.094 141.038Z" fill={color}/>
      <path d="M742.8 93.9565H727.425C725.253 83.6019 715.894 76.3213 704.196 76.3213C690.659 76.3213 678.292 86.5141 678.292 108.356C678.292 130.521 690.826 141.038 704.196 141.038C716.897 141.038 725.921 132.786 728.094 123.564H743.803C740.795 139.905 724.584 153.981 703.694 153.981C677.958 153.981 661.748 135.052 661.748 108.518C661.748 82.6311 678.627 63.3779 705.198 63.3779C726.924 63.3779 740.795 79.2335 742.8 93.9565Z" fill={color}/>
      <path d="M594.14 42.9924H609.348V64.8343H626.394V76.645H609.348V128.256C609.348 137.317 610.017 139.582 618.707 139.582H626.394V151.878H615.364C598.151 151.878 594.14 148.157 594.14 130.036V76.645H579.935V64.8343H594.14V42.9924Z" fill={color}/>
      <path d="M516.332 77.9392C521.513 69.6878 530.203 63.3779 545.411 63.3779C567.136 63.3779 574.991 76.9684 574.991 96.8688V151.878H559.783V101.237C559.783 87.8084 557.443 76.1595 540.063 76.1595C525.356 76.1595 516.332 86.0287 516.332 104.635V151.878H501.124V64.8341H516.332V77.9392Z" fill={color}/>
      <path d="M422.153 113.21C422.822 131.978 436.525 141.038 449.895 141.038C463.264 141.038 470.617 135.213 474.461 126.638H490.17C485.992 141.685 471.787 153.981 449.895 153.981C421.485 153.981 405.775 134.243 405.775 108.518C405.775 81.0132 424.827 63.3779 449.393 63.3779C476.801 63.3779 493.346 85.7052 491.34 113.21H422.153ZM422.32 100.59H475.297C474.963 88.2938 465.437 75.9977 449.393 75.9977C435.857 75.9977 423.657 83.1165 422.32 100.59Z" fill={color}/>
      <path d="M284.796 151.878H269.589V64.8341H284.796V77.9392C289.977 69.6878 298.333 63.3779 311.87 63.3779C325.573 63.3779 333.762 69.2024 337.773 78.7481C344.959 68.0699 355.488 63.3779 368.022 63.3779C388.911 63.3779 397.1 76.9684 397.1 96.8688V151.878H381.892V101.237C381.892 87.8084 379.218 76.1595 362.674 76.1595C349.639 76.1595 340.948 86.0287 340.948 104.635V151.878H325.741V101.237C325.741 87.8084 323.067 76.1595 306.522 76.1595C293.487 76.1595 284.796 86.0287 284.796 104.635V151.878Z" fill={color}/>
      <path d="M238.306 64.8341H253.514V140.229C253.514 158.026 250.172 165.307 244.991 170.807C238.473 178.088 227.276 182.295 213.907 182.295C193.518 182.295 179.815 173.234 176.974 155.599H193.184C195.19 163.365 200.036 169.351 214.074 169.351C222.263 169.351 228.446 167.086 232.457 162.88C235.799 159.482 238.306 155.437 238.306 143.626V135.375C232.791 144.597 224.101 150.422 209.729 150.422C189.842 150.422 171.626 134.89 171.626 106.9C171.626 79.0717 189.842 63.3779 209.729 63.3779C224.101 63.3779 232.791 69.3642 238.306 78.5863V64.8341ZM213.573 75.9977C198.699 75.9977 188.171 87.1613 188.171 106.9C188.171 126.8 198.699 137.964 213.573 137.964C227.109 137.964 238.975 129.065 238.975 106.9C238.975 84.8962 227.109 75.9977 213.573 75.9977Z" fill={color}/>
      <path d="M146.413 139.424C141.232 147.676 133.043 153.986 118.17 153.986C97.2798 153.986 89.4253 140.395 89.4253 120.495V64.8386H104.633V116.127C104.633 129.555 106.973 141.204 123.517 141.204C137.89 141.204 146.413 131.335 146.413 112.729V64.8386H161.62V151.882H146.413V139.424Z" fill={color}/>
      <path d="M0 128.903C0 108.356 23.898 102.37 60.8311 98.3247V96.2214C60.8311 80.3659 51.6396 75.0268 40.4427 75.0268C27.9088 75.0268 20.5556 81.6602 19.8871 92.3384H4.17796C5.68203 73.5706 22.7281 63.0542 40.2756 63.0542C65.0091 63.0542 76.2061 74.5414 76.0389 98.9719L75.8718 119.034C75.7047 133.595 76.5403 143.626 78.2115 151.878H62.8366C62.3352 148.642 61.8339 145.082 61.6667 139.905C56.1518 148.804 46.7932 153.981 30.9169 153.981C14.038 153.981 0 144.921 0 128.903ZM62.001 109.974C34.4264 112.724 16.879 116.607 16.879 128.58C16.879 136.831 23.3966 142.332 34.2593 142.332C48.4644 142.332 62.001 136.022 62.001 115.475V109.974Z" fill={color}/>
    </svg>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/AugmentLogo.tsx
git commit -m "feat: add AugmentLogo SVG component"
```

---

## Task 5: Ad template components

**Files:**
- Create: `templates/BigTypeBody.tsx`, `templates/BigTypeBody.css`
- Create: `templates/StatHero.tsx`, `templates/StatHero.css`
- Create: `templates/CustomerQuote.tsx`, `templates/CustomerQuote.css`

Note: Templates in v2 accept a `Variant` prop directly instead of `AdConfig`. The CSS is copied from v1 unchanged.

- [ ] **Step 1: Create `templates/BigTypeBody.css`**

```css
.tpl-btb {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  padding: min(8cqw, 8cqh);
  gap: min(5cqw, 5cqh);
}
.btb-logo {
  width: min(18cqw, 18cqh); color: var(--ad-fg);
  flex-shrink: 0;
}
.btb-main {
  display: flex; flex-direction: column;
  flex: 1; min-height: 0;
}
.btb-headline {
  font-size: min(9cqw, 16cqh); font-weight: 300;
  line-height: 1.1; letter-spacing: -0.025em;
  color: var(--ad-fg);
  flex: 1; min-height: 0; overflow: hidden;
}
.btb-footer {
  padding-top: min(4cqw, 4cqh);
  border-top: 1px solid var(--ad-border);
  flex-shrink: 0;
}
.btb-cta {
  display: inline-block;
  background: var(--ad-accent);
  color: var(--ad-cta-text);
  font-family: var(--font-sans);
  font-size: min(3cqw, 5.5cqh);
  font-weight: 500;
  padding: min(1.5cqw, 2.5cqh) min(4cqw, 7cqh);
  border: none;
  border-radius: 2px;
  cursor: default;
  letter-spacing: 0.01em;
}
```

- [ ] **Step 2: Create `templates/BigTypeBody.tsx`**

```tsx
import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './BigTypeBody.css'

interface Props { variant: Variant }

export default function BigTypeBody({ variant }: Props) {
  return (
    <div className="tpl-btb">
      <div className="btb-logo"><AugmentLogo /></div>
      <div className="btb-main">
        <div className="btb-headline">{variant.headline}</div>
      </div>
      {variant.cta && (
        <div className="btb-footer">
          <button className="btb-cta">{variant.cta}</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `templates/StatHero.css`**

```css
.tpl-sh {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  padding: 8cqw;
}
.sh-stat {
  font-family: var(--font-mono);
  font-size: 24cqw; font-weight: 400;
  color: var(--ad-accent);
  line-height: 0.85; letter-spacing: -0.04em;
  margin-bottom: 2cqw;
}
.sh-stat-label {
  font-family: var(--font-mono);
  font-size: 2.8cqw; font-weight: 400;
  color: var(--ad-accent); opacity: 0.55;
  text-transform: uppercase; letter-spacing: 0.12em;
  margin-bottom: 6cqw;
}
.sh-headline {
  font-size: 5.5cqw; font-weight: 300;
  color: var(--ad-fg);
  line-height: 1.25; letter-spacing: -0.015em;
  flex: 1;
}
.sh-footer {
  display: flex; align-items: center;
  justify-content: space-between;
  padding-top: 5cqw;
  border-top: 1px solid var(--ad-border);
  margin-top: 5cqw;
}
.sh-cta {
  font-family: var(--font-mono);
  font-size: 2.5cqw; color: var(--ad-accent);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.sh-logo {
  width: 14cqw; color: var(--ad-fg-dim);
}
```

- [ ] **Step 4: Create `templates/StatHero.tsx`**

```tsx
import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './StatHero.css'

interface Props { variant: Variant }

export default function StatHero({ variant }: Props) {
  return (
    <div className="tpl-sh">
      {variant.stat && <div className="sh-stat">{variant.stat}</div>}
      {variant.stat_label && <div className="sh-stat-label">{variant.stat_label}</div>}
      <div className="sh-headline">{variant.headline}</div>
      <div className="sh-footer">
        {variant.cta && <div className="sh-cta">{variant.cta}</div>}
        <div className="sh-logo"><AugmentLogo /></div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `templates/CustomerQuote.css`**

```css
.tpl-cq {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  padding: min(8cqw, 8cqh);
  gap: min(5cqw, 5cqh);
}
.cq-logo {
  width: min(18cqw, 18cqh); color: var(--ad-fg);
  flex-shrink: 0;
}
.cq-content {
  display: flex; flex-direction: column;
  flex: 1; min-height: 0;
  justify-content: center;
}
.cq-quote {
  font-size: min(6.5cqw, 11.5cqh); font-weight: 300;
  color: var(--ad-fg);
  line-height: 1.2; letter-spacing: -0.02em;
  overflow: hidden;
}
.cq-quote-mark {
  font-size: min(10cqw, 17.5cqh); color: var(--ad-accent);
  line-height: 1; display: inline-block;
  margin-right: min(1cqw, 1cqh); vertical-align: min(-1cqw, -1cqh);
  font-weight: 300;
}
.cq-attribution {
  font-family: var(--font-mono);
  font-size: min(2.8cqw, 5cqh); color: var(--ad-fg-muted);
  margin-top: min(4cqw, 4cqh); line-height: 1.5;
}
.cq-footer {
  padding-top: min(4cqw, 4cqh);
  border-top: 1px solid var(--ad-border);
  flex-shrink: 0;
}
.cq-cta {
  display: inline-block;
  background: var(--ad-accent);
  color: var(--ad-cta-text);
  font-family: var(--font-sans);
  font-size: min(3cqw, 5.5cqh);
  font-weight: 500;
  padding: min(1.5cqw, 2.5cqh) min(4cqw, 7cqh);
  border: none;
  border-radius: 2px;
  cursor: default;
  letter-spacing: 0.01em;
}
```

- [ ] **Step 6: Create `templates/CustomerQuote.tsx`**

```tsx
import type { Variant } from '@/lib/types'
import AugmentLogo from '@/components/AugmentLogo'
import './CustomerQuote.css'

interface Props { variant: Variant }

export default function CustomerQuote({ variant }: Props) {
  return (
    <div className="tpl-cq">
      <div className="cq-logo"><AugmentLogo /></div>
      <div className="cq-content">
        <div className="cq-quote">
          <span className="cq-quote-mark">"</span>{variant.headline}
        </div>
      </div>
      {variant.cta && (
        <div className="cq-footer">
          <button className="cq-cta">{variant.cta}</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add templates/
git commit -m "feat: add BigTypeBody, StatHero, CustomerQuote templates"
```

---

## Task 6: AdRenderer component

**Files:**
- Create: `components/AdRenderer.tsx`
- Test: `components/AdRenderer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/AdRenderer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import AdRenderer from './AdRenderer'
import type { Variant } from '@/lib/types'

const baseVariant: Variant = {
  id: 'v1',
  layout: 'big-type-body',
  theme: 'dark',
  background: 'none',
  copy_angle: 'benefit',
  headline: 'Code faster with AI',
  cta: 'Try free →',
  stat: null,
  stat_label: null,
  reasoning: 'test'
}

describe('AdRenderer', () => {
  it('renders without crashing for big-type-body', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('applies theme-dark class', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect((container.firstChild as HTMLElement).className).toContain('theme-dark')
  })

  it('applies theme-tonal class when theme is tonal', () => {
    const variant = { ...baseVariant, theme: 'tonal' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('theme-tonal')
  })

  it('applies bg-dot-grid class when background is dot-grid', () => {
    const variant = { ...baseVariant, background: 'dot-grid' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect((container.firstChild as HTMLElement).className).toContain('bg-dot-grid')
  })

  it('does not apply bg class when background is none', () => {
    const { container } = render(<AdRenderer variant={baseVariant} />)
    expect((container.firstChild as HTMLElement).className).not.toContain('bg-')
  })

  it('renders stat-hero layout', () => {
    const variant = { ...baseVariant, layout: 'stat-hero' as const, stat: '10%', stat_label: 'faster' }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.querySelector('.tpl-sh')).toBeTruthy()
  })

  it('renders customer-quote layout', () => {
    const variant = { ...baseVariant, layout: 'customer-quote' as const }
    const { container } = render(<AdRenderer variant={variant} />)
    expect(container.querySelector('.tpl-cq')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/AdRenderer.test.tsx
```
Expected: FAIL — `Cannot find module './AdRenderer'`

- [ ] **Step 3: Create `components/AdRenderer.tsx`**

```tsx
'use client'
import type { Variant } from '@/lib/types'
import BigTypeBody from '@/templates/BigTypeBody'
import StatHero from '@/templates/StatHero'
import CustomerQuote from '@/templates/CustomerQuote'
import '@/templates/templates.css'

interface Props {
  variant: Variant
  className?: string
  style?: React.CSSProperties
}

export default function AdRenderer({ variant, className, style }: Props) {
  const themeClass = `theme-${variant.theme}`
  const bgClass = variant.background !== 'none' ? `bg-${variant.background}` : ''
  const classes = ['ad-canvas', themeClass, bgClass, className]
    .filter(Boolean)
    .join(' ')

  switch (variant.layout) {
    case 'big-type-body':
      return <BigTypeBody variant={variant} />
    case 'stat-hero':
      return <StatHero variant={variant} />
    case 'customer-quote':
      return <CustomerQuote variant={variant} />
    default:
      return null
  }
}
```

Wait — the outer wrapper with the class needs to wrap the inner template. Fix:

```tsx
'use client'
import type { Variant } from '@/lib/types'
import BigTypeBody from '@/templates/BigTypeBody'
import StatHero from '@/templates/StatHero'
import CustomerQuote from '@/templates/CustomerQuote'
import '@/templates/templates.css'

interface Props {
  variant: Variant
  className?: string
  style?: React.CSSProperties
}

export default function AdRenderer({ variant, className, style }: Props) {
  const themeClass = `theme-${variant.theme}`
  const bgClass = variant.background !== 'none' ? `bg-${variant.background}` : ''
  const classes = ['ad-canvas', themeClass, bgClass, className]
    .filter(Boolean)
    .join(' ')

  const inner = (() => {
    switch (variant.layout) {
      case 'big-type-body': return <BigTypeBody variant={variant} />
      case 'stat-hero':     return <StatHero variant={variant} />
      case 'customer-quote': return <CustomerQuote variant={variant} />
      default: return null
    }
  })()

  return (
    <div className={classes} style={style}>
      {inner}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run components/AdRenderer.test.tsx
```
Expected: PASS — 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/AdRenderer.tsx components/AdRenderer.test.tsx
git commit -m "feat: add AdRenderer component with theme/bg class application"
```

---

## Task 7: Claude API route

**Files:**
- Create: `app/api/generate/route.ts`
- Test: `app/api/generate/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/generate/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the AI SDK before importing route
vi.mock('ai', () => ({
  generateObject: vi.fn()
}))
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model')
}))

import { POST } from './route'
import { generateObject } from 'ai'

const mockVariants = Array.from({ length: 5 }, (_, i) => ({
  id: `v${i + 1}`,
  layout: 'big-type-body',
  theme: 'dark',
  background: 'none',
  copy_angle: 'benefit',
  headline: `Headline ${i + 1}`,
  cta: 'Try free →',
  stat: null,
  stat_label: null,
  reasoning: 'test reasoning'
}))

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.mocked(generateObject).mockResolvedValue({ object: { variants: mockVariants } } as never)
  })

  it('returns 400 when prompt is missing', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ platforms: ['linkedin'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when platforms is empty', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test', platforms: [] })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with 5 variants on valid input', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Augment makes devs 10% faster', platforms: ['linkedin'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.variants).toHaveLength(5)
  })

  it('each variant has required fields', async () => {
    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test prompt', platforms: ['linkedin'] })
    })
    const res = await POST(req)
    const data = await res.json()
    for (const v of data.variants) {
      expect(v.id).toBeTruthy()
      expect(v.layout).toBeTruthy()
      expect(v.theme).toBeTruthy()
      expect(v.headline).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run app/api/generate/route.test.ts
```
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Create `app/api/generate/route.ts`**

```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import type { GenerateRequest } from '@/lib/types'

const VariantSchema = z.object({
  id: z.string(),
  layout: z.enum(['big-type-body', 'stat-hero', 'customer-quote']),
  theme: z.enum(['dark', 'light', 'tonal']),
  background: z.enum(['none', 'dot-grid', 'grid']),
  copy_angle: z.enum(['metric-led', 'benefit', 'bold-claim', 'brand-awareness']),
  headline: z.string().max(80),
  cta: z.string().max(40).nullable(),
  stat: z.string().nullable(),
  stat_label: z.string().nullable(),
  reasoning: z.string()
})

const ResponseSchema = z.object({
  variants: z.array(VariantSchema).length(5)
})

const SYSTEM_PROMPT = `You are an expert ad designer for Augment Code, an AI coding assistant for developers.

Generate exactly 5 ad variants based on the user's prompt. Each variant must be distinct.

Rules:
- Cover at least 2 different themes across the 5 variants (dark, light, tonal)
- Cover at least 2 different layouts across the 5 variants
- Vary copy_angle across variants — do not repeat the same angle more than twice
- Headlines: punchy, ≤8 words, no filler ("discover", "unlock", "revolutionize")
- CTAs: short action phrase ≤5 words (e.g. "Try free →", "See benchmarks →", null if not needed)
- stat/stat_label: only when the prompt contains a specific metric (e.g. "10% faster" → stat="10%", stat_label="faster dev speed")
- stat is only meaningful with layout=stat-hero; use null for other layouts
- reasoning: one sentence explaining why this combination fits

Augment Code brand voice: technical, confident, precise. Ground claims in developer experience. Avoid generic AI hype.

Available layouts: big-type-body, stat-hero, customer-quote
Available themes: dark, light, tonal
Available backgrounds: none, dot-grid, grid
Available copy_angles: metric-led, benefit, bold-claim, brand-awareness

Assign ids: "v1" through "v5".`

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    if (!body.platforms?.length) {
      return NextResponse.json({ error: 'at least one platform is required' }, { status: 400 })
    }

    const userMessage = `Prompt: "${body.prompt}"\nTarget platforms: ${body.platforms.join(', ')}`

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: ResponseSchema,
      system: SYSTEM_PROMPT,
      prompt: userMessage
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error('[/api/generate]', err)
    return NextResponse.json({ error: 'generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run app/api/generate/route.test.ts
```
Expected: PASS — 4 tests pass

- [ ] **Step 5: Smoke-test against real Claude**

Start dev server: `npm run dev`

In a separate terminal:
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Augment makes devs 10% faster at code review","platforms":["linkedin"]}' \
  | jq '.variants | length'
```
Expected: `5`

- [ ] **Step 6: Commit**

```bash
git add app/api/generate/
git commit -m "feat: add Claude API route for 5-variant generation"
```

---

## Task 8: export.ts

**Files:**
- Create: `lib/export.ts`
- Test: `lib/export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/export.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc123')
}))

import { exportAdElement } from './export'
import { toPng } from 'html-to-image'

describe('exportAdElement', () => {
  it('calls toPng with correct dimensions', async () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetWidth', { value: 400 })
    Object.defineProperty(el, 'offsetHeight', { value: 400 })

    await exportAdElement(el, 1080, 1080, 'test-ad')

    expect(toPng).toHaveBeenCalledWith(el, expect.objectContaining({
      canvasWidth: 1080,
      canvasHeight: 1080
    }))
  })

  it('triggers a download link click', async () => {
    const el = document.createElement('div')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportAdElement(el, 1080, 1080, 'my-ad')

    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/export.test.ts
```
Expected: FAIL — `Cannot find module './export'`

- [ ] **Step 3: Create `lib/export.ts`**

```typescript
import { toPng } from 'html-to-image'

export async function exportAdElement(
  element: HTMLElement,
  targetWidth: number,
  targetHeight: number,
  filename: string
): Promise<void> {
  await document.fonts.ready

  const dataUrl = await toPng(element, {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    pixelRatio: 2
  })

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  link.click()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/export.test.ts
```
Expected: PASS — 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/export.ts lib/export.test.ts
git commit -m "feat: add html-to-image export utility"
```

---

## Task 9: PromptInput component

**Files:**
- Create: `components/PromptInput.tsx`
- Create: `components/PromptInput.css`

- [ ] **Step 1: Create `components/PromptInput.css`**

```css
.prompt-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
  margin: 0 auto;
}

.prompt-textarea {
  width: 100%;
  min-height: 80px;
  background: #111114;
  border: 1px solid #2a2a35;
  border-radius: 4px;
  color: #f5f5f7;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.5;
  padding: 14px 16px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}
.prompt-textarea:focus {
  border-color: #1AA049;
}
.prompt-textarea::placeholder {
  color: #444;
}

.platforms-label {
  font-size: 11px;
  color: #555;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.platforms-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #2a2a35;
  border-radius: 2px;
  background: transparent;
  color: #888;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  user-select: none;
}
.platform-chip:hover {
  border-color: #444;
  color: #aaa;
}
.platform-chip.selected {
  border-color: #1AA049;
  color: #1AA049;
}

.generate-btn {
  align-self: flex-start;
  background: #1AA049;
  color: #000;
  border: none;
  border-radius: 2px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 24px;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: opacity 0.15s;
}
.generate-btn:hover { opacity: 0.85; }
.generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] **Step 2: Create `components/PromptInput.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { Platform } from '@/lib/types'
import { PLATFORM_LABELS } from '@/lib/constants'
import './PromptInput.css'

interface Props {
  onGenerate: (prompt: string, platforms: Platform[]) => void
  loading: boolean
}

const ALL_PLATFORMS: Platform[] = ['linkedin', 'instagram', 'twitter', 'reddit', 'google-display']

export default function PromptInput({ onGenerate, loading }: Props) {
  const [prompt, setPrompt] = useState('')
  const [selected, setSelected] = useState<Platform[]>(['linkedin'])

  function togglePlatform(p: Platform) {
    setSelected(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || selected.length === 0 || loading) return
    onGenerate(prompt.trim(), selected)
  }

  return (
    <form className="prompt-input" onSubmit={handleSubmit}>
      <textarea
        className="prompt-textarea"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe your ad… e.g. Augment makes devs 10% faster at code review"
        rows={3}
      />
      <div>
        <div className="platforms-label">Platforms</div>
        <div className="platforms-grid">
          {ALL_PLATFORMS.map(p => (
            <button
              key={p}
              type="button"
              className={`platform-chip${selected.includes(p) ? ' selected' : ''}`}
              onClick={() => togglePlatform(p)}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <button
        className="generate-btn"
        type="submit"
        disabled={!prompt.trim() || selected.length === 0 || loading}
      >
        {loading ? 'Generating…' : 'Generate 5 variants →'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/PromptInput.tsx components/PromptInput.css
git commit -m "feat: add PromptInput component with platform selection"
```

---

## Task 10: VariantCard + VariantGrid + ExportModal

**Files:**
- Create: `components/VariantCard.tsx`, `components/VariantCard.css`
- Create: `components/VariantGrid.tsx`, `components/VariantGrid.css`
- Create: `components/ExportModal.tsx`, `components/ExportModal.css`

- [ ] **Step 1: Create `components/VariantCard.css`**

```css
.variant-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.variant-ad-wrap {
  aspect-ratio: 1;
  width: 100%;
  position: relative;
  border-radius: 2px;
  overflow: hidden;
}

.variant-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.variant-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  color: #555;
  background: #111114;
  border: 1px solid #1e1e26;
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.variant-tag.accent { color: #1AA049; border-color: #1a2a1a; }

.variant-reasoning {
  font-size: 10px;
  color: #444;
  line-height: 1.4;
  font-style: italic;
}

.variant-export-btn {
  align-self: flex-start;
  background: transparent;
  border: 1px solid #2a2a35;
  color: #888;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.04em;
  transition: border-color 0.15s, color 0.15s;
}
.variant-export-btn:hover { border-color: #1AA049; color: #1AA049; }
```

- [ ] **Step 2: Create `components/VariantCard.tsx`**

```tsx
'use client'
import { useRef } from 'react'
import type { Variant, Platform } from '@/lib/types'
import AdRenderer from './AdRenderer'
import './VariantCard.css'

interface Props {
  variant: Variant
  platforms: Platform[]
  onExport: (element: HTMLElement, variant: Variant) => void
}

export default function VariantCard({ variant, platforms, onExport }: Props) {
  const adRef = useRef<HTMLDivElement>(null)

  return (
    <div className="variant-card">
      <div className="variant-ad-wrap" ref={adRef}>
        <AdRenderer
          variant={variant}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="variant-meta">
        <div className="variant-tags">
          <span className="variant-tag accent">{variant.layout}</span>
          <span className="variant-tag">{variant.theme}</span>
          <span className="variant-tag">{variant.background}</span>
          <span className="variant-tag">{variant.copy_angle}</span>
        </div>
        <div className="variant-reasoning">{variant.reasoning}</div>
      </div>
      <button
        className="variant-export-btn"
        onClick={() => adRef.current && onExport(adRef.current, variant)}
      >
        Export →
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/VariantGrid.css`**

```css
.variant-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.variant-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-ad {
  aspect-ratio: 1;
  background: #111114;
  border: 1px solid #1e1e26;
  border-radius: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 10px;
  background: #111114;
  border-radius: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
```

- [ ] **Step 4: Create `components/VariantGrid.tsx`**

```tsx
'use client'
import type { Variant, Platform } from '@/lib/types'
import VariantCard from './VariantCard'
import './VariantGrid.css'

interface Props {
  variants: Variant[]
  platforms: Platform[]
  loading: boolean
  onExport: (element: HTMLElement, variant: Variant) => void
}

export default function VariantGrid({ variants, platforms, loading, onExport }: Props) {
  if (loading) {
    return (
      <div className="variant-grid-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-ad" />
            <div className="skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton-line" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (variants.length === 0) return null

  return (
    <div className="variant-grid">
      {variants.map(v => (
        <VariantCard
          key={v.id}
          variant={v}
          platforms={platforms}
          onExport={onExport}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create `components/ExportModal.css`**

```css
.export-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.export-modal {
  background: #111114;
  border: 1px solid #2a2a35;
  border-radius: 4px;
  padding: 24px;
  min-width: 320px;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-modal-title {
  font-size: 13px;
  color: #f5f5f7;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.export-modal-subtitle {
  font-size: 11px;
  color: #555;
  font-family: var(--font-mono);
}

.export-sizes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-size-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #1e1e26;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s;
}
.export-size-btn:hover { border-color: #1AA049; }

.export-size-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #888;
}

.export-size-platform {
  font-family: var(--font-mono);
  font-size: 10px;
  color: #444;
}

.export-modal-close {
  align-self: flex-end;
  background: transparent;
  border: 1px solid #2a2a35;
  color: #555;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 2px;
  transition: color 0.15s;
}
.export-modal-close:hover { color: #f5f5f7; }
```

- [ ] **Step 6: Create `components/ExportModal.tsx`**

```tsx
'use client'
import type { Variant, Platform } from '@/lib/types'
import { PLATFORM_SIZES, PLATFORM_LABELS, type AdSize } from '@/lib/constants'
import { exportAdElement } from '@/lib/export'
import './ExportModal.css'

interface Props {
  variant: Variant
  element: HTMLElement
  platforms: Platform[]
  onClose: () => void
}

export default function ExportModal({ variant, element, platforms, onClose }: Props) {
  const sizes: Array<AdSize & { platform: Platform }> = platforms.flatMap(p =>
    PLATFORM_SIZES[p].map(s => ({ ...s, platform: p }))
  )

  // Deduplicate by label (e.g. 1080×1080 appears on both LinkedIn and Instagram)
  const unique = sizes.filter(
    (s, i, arr) => arr.findIndex(x => x.label === s.label) === i
  )

  async function handleDownload(size: AdSize) {
    const filename = `augment-ad-${variant.layout}-${variant.theme}-${size.label}`
    await exportAdElement(element, size.width, size.height, filename)
  }

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div>
          <div className="export-modal-title">Export variant</div>
          <div className="export-modal-subtitle">
            {variant.layout} · {variant.theme} · {variant.background}
          </div>
        </div>
        <div className="export-sizes">
          {unique.map(s => (
            <button
              key={s.label}
              className="export-size-btn"
              onClick={() => handleDownload(s)}
            >
              <span className="export-size-label">{s.label}</span>
              <span className="export-size-platform">{PLATFORM_LABELS[s.platform]}</span>
            </button>
          ))}
        </div>
        <button className="export-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add components/VariantCard.tsx components/VariantCard.css \
        components/VariantGrid.tsx components/VariantGrid.css \
        components/ExportModal.tsx components/ExportModal.css
git commit -m "feat: add VariantCard, VariantGrid, ExportModal components"
```

---

## Task 11: Builder page + layout

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/page.css`

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Augment Ad Builder',
  description: 'AI-generated ad variants for Augment Code'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create `app/page.css`**

```css
.builder {
  min-height: 100vh;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.builder-header {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.builder-title {
  font-size: 12px;
  font-family: var(--font-mono);
  color: #1AA049;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.builder-subtitle {
  font-size: 24px;
  font-weight: 300;
  color: #f5f5f7;
  letter-spacing: -0.02em;
}

.builder-variants {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { Variant, Platform } from '@/lib/types'
import PromptInput from '@/components/PromptInput'
import VariantGrid from '@/components/VariantGrid'
import ExportModal from '@/components/ExportModal'
import './page.css'

interface ExportTarget {
  element: HTMLElement
  variant: Variant
}

export default function BuilderPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)

  async function handleGenerate(prompt: string, selectedPlatforms: Platform[]) {
    setLoading(true)
    setError(null)
    setPlatforms(selectedPlatforms)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platforms: selectedPlatforms })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }

      const data = await res.json()
      setVariants(data.variants)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="builder">
      <div className="builder-header">
        <div className="builder-title">Augment Ad Builder</div>
        <div className="builder-subtitle">Describe your ad. Get 5 variants.</div>
      </div>

      <PromptInput onGenerate={handleGenerate} loading={loading} />

      {error && (
        <div style={{ color: '#ff6b6b', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="builder-variants">
        <VariantGrid
          variants={variants}
          platforms={platforms}
          loading={loading}
          onExport={(el, v) => setExportTarget({ element: el, variant: v })}
        />
      </div>

      {exportTarget && (
        <ExportModal
          variant={exportTarget.variant}
          element={exportTarget.element}
          platforms={platforms}
          onClose={() => setExportTarget(null)}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 4: Start dev server and verify full flow works**

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Type: `Augment makes devs 10% faster at code review`
3. Select LinkedIn
4. Click "Generate 5 variants →"
5. Verify: loading skeleton appears, then 5 variant cards appear
6. Click "Export →" on any card — export modal should open
7. Click a size — PNG should download

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx app/page.css
git commit -m "feat: wire builder page — prompt → generate → variants → export"
```

---

## Task 12: Run full test suite + push

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```
Expected: all tests pass (lib/types.test.ts, lib/export.test.ts, components/AdRenderer.test.tsx, app/api/generate/route.test.ts)

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Expected: no errors

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 5: Verify deploy on Vercel**

If Vercel is connected to the repo via GitHub integration, a deployment will trigger automatically. Otherwise:
```bash
npx vercel --prod
```

Set environment variable in Vercel dashboard:
- `ANTHROPIC_API_KEY` = your key

Open the Vercel URL and verify the full flow works in production.

---

## Self-Review Checklist

**Spec coverage:**
- [x] §2 User Flow — prompt input (Task 9), platform select (Task 9), 5 variants (Task 7), export (Tasks 8 + 10)
- [x] §3 Templates — BigTypeBody, StatHero, CustomerQuote (Task 5); line-editorial + illustration deferred
- [x] §4 Variation parameters — all fields in Zod schema + types (Tasks 2, 7)
- [x] §5 Platform sizes — PLATFORM_SIZES covers all 5 platforms (Task 2)
- [x] §6 Design tokens — templates.css has all theme + bg classes (Task 3)
- [x] §7 AI generation — API route with Claude, Zod schema, system prompt (Task 7)
- [x] §10 Tech stack — Next.js 15, Vercel AI SDK, html-to-image, Supabase deferred to Plan 2
- [x] §8 Feedback (Supabase) — **Plan 2**
- [x] §9 Living doc — **Plan 2**

**Type consistency:**
- `Variant` defined in `lib/types.ts`, used consistently across AdRenderer, VariantCard, VariantGrid, ExportModal, API route
- `Platform` used in PromptInput, VariantCard, VariantGrid, ExportModal, constants
- `AdSize` exported from `lib/constants.ts`, imported in ExportModal
