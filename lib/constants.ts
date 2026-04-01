import type { Platform } from './types'

export interface AdSize {
  width: number
  height: number
  label: string   // ratio e.g. "1:1" or pixel e.g. "300×250"
  pixels: string  // always pixel dimensions e.g. "1080×1080"
}

// Active (MVP) sizes only — 1:1 for social, 300×250 for display
// Phase 2: add 4:5, 9:16, 16:9, 1.91:1, 300×600
export const PLATFORM_SIZES: Record<Platform, AdSize> = {
  linkedin:        { width: 1080, height: 1080, label: '1:1',     pixels: '1080×1080' },
  twitter:         { width: 1080, height: 1080, label: '1:1',     pixels: '1080×1080' },
  reddit:          { width: 1080, height: 1080, label: '1:1',     pixels: '1080×1080' },
  'google-display': { width: 300,  height: 250,  label: '300×250', pixels: '300×250'   }
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  reddit: 'Reddit',
  'google-display': 'Google Display'
}
