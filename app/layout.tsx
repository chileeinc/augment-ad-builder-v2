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
