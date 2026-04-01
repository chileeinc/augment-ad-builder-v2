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
