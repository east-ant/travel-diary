// frontend/app/diary/layout.tsx

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Diary',
  description: 'Smart diary that AI analyzes',
  generator: 'v0.app',
}

export default function DiaryLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      <Analytics />
      <Toaster />
    </>
  )
}