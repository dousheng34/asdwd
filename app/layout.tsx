import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

/**
 * Root layout for the arbitration system
 * Sets up metadata, fonts, and global styling
 */
export const metadata: Metadata = {
  title: 'Game Exchange Arbitration System',
  description: 'Independent dispute resolution for game item trades',
  keywords: ['arbitration', 'dispute resolution', 'game trading', 'escrow'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arbitration-system.vercel.app',
    siteName: 'Game Exchange Arbitration',
    title: 'Game Exchange Arbitration System',
    description: 'Independent dispute resolution for game item trades',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game Exchange Arbitration System',
    description: 'Independent dispute resolution for game item trades',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
