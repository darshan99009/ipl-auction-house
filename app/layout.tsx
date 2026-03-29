import type { Metadata, Viewport } from 'next'
import { Teko, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const teko = Teko({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-teko',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'IPL Auction House',
    template: '%s · IPL Auction House',
  },
  description: 'Real-time multiplayer IPL auction simulator — bid, build squads, and dominate the league.',
  keywords: ['IPL', 'auction', 'cricket', 'multiplayer', 'fantasy'],
  authors: [{ name: 'Darshan Gowda S' }],
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#060810',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${teko.variable} ${jakarta.variable}`}>
      <body className="bg-void text-text-primary font-body antialiased noise">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#141B2D',
              border: '1px solid #1E2A40',
              color: '#F0F4FF',
              fontFamily: 'var(--font-jakarta)',
            },
          }}
        />
      </body>
    </html>
  )
}
