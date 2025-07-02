import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#84F29B' },
    { media: '(prefers-color-scheme: dark)', color: '#191C19' },
  ],
} 