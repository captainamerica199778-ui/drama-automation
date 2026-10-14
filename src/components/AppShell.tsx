'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <div className="relative z-10 flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Top Header */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0a0c16]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="font-bold text-base bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                DramaAuto
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
              <Link
                href="/settings"
                className="p-1.5 rounded-lg glass-card text-gray-400 hover:text-white border border-white/[0.06]"
                title="Settings & Telegram"
              >
                <Settings size={15} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg glass-card text-gray-400 hover:text-rose-400 border border-white/[0.06]"
                title="Lock / Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 md:pb-8 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </>
  )
}
