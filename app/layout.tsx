import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'react-notion-x/src/styles.css'
import '@/styles/notion.css'
import siteConfig from '@/site.config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  authors: siteConfig.author ? [{ name: siteConfig.author }] : undefined,
  metadataBase: new URL(`https://${siteConfig.domain}`),
  alternates: {
    types: {
      'application/rss+xml': `https://${siteConfig.domain}/api/rss`,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
          <Header />
          <Sidebar />
          <div className="flex-1">{children}</div>
          <Footer />
        </body>
    </html>
  )
}
