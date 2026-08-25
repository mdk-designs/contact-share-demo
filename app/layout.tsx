import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B132B',
}

export const metadata: Metadata = {
  title: 'Deepak Kumar · Digital Business Card',
  description:
    'Deepak Kumar — UI/UX Engineer & Product Designer. Exchange contacts and connect instantly.',
  openGraph: {
    title: 'Deepak Kumar · Digital Business Card',
    description: 'UI/UX Engineer & Product Designer. Connect instantly.',
    type: 'profile',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  )
}
