import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drama Automation',
  description: 'AI Drama Multi-Platform Publishing Automation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} dark h-full antialiased`}>
      <body className="bg-[#08090e] text-gray-100 min-h-full selection:bg-purple-500/30 selection:text-purple-200">
        {/* Background ambient lighting */}
        <div className="ambient-glow">
          <div className="glow-orb-1" />
          <div className="glow-orb-2" />
          <div className="glow-orb-3" />
        </div>

        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
