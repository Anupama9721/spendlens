import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpendLens — AI Tool Spend Auditor',
  description: 'Free audit for startups. Find out exactly where you\'re overpaying on AI tools and what to do about it.',
  openGraph: {
    title: 'SpendLens — AI Tool Spend Auditor',
    description: 'Find out exactly where you\'re overpaying on AI tools. Free, instant, no login.',
    url: process.env.NEXT_PUBLIC_BASE_URL,
    siteName: 'SpendLens',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpendLens — AI Tool Spend Auditor',
    description: 'Find out exactly where you\'re overpaying on AI tools. Free, instant, no login.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
