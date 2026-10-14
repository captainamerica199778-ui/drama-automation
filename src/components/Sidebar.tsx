'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Tv, Upload, Link2, HardDrive, Settings, Clapperboard, LogOut
} from 'lucide-react'

const nav = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/series',    label: 'Series',     icon: Tv },
  { href: '/upload',    label: 'Upload',     icon: Upload },
  { href: '/accounts',  label: 'Accounts',   icon: Link2 },
  { href: '/storage',   label: 'Storage',    icon: HardDrive },
  { href: '/settings',  label: 'Settings',   icon: Settings },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 glass-panel border-r border-white/[0.08] h-full justify-between z-20">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-white/20">
            <Clapperboard className="text-white" size={20} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">DramaAuto</span>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-purple-400">AI Video Hub</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-6 space-y-1.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-transparent text-white border border-purple-500/30 shadow-[0_0_20px_-3px_rgba(168,85,247,0.25)]'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-gradient-to-b from-purple-400 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                )}
                <Icon
                  size={19}
                  className={`transition-colors duration-200 ${
                    active ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]' : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                />
                <span className="tracking-wide">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer System Status & Logout */}
      <div className="mx-3 mb-4 space-y-2">
        <div className="p-3.5 rounded-xl glass-card border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 font-medium">Engine Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">Protected session active.</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-rose-300 glass-card hover:bg-rose-500/10 border border-white/[0.06] transition-colors"
        >
          <LogOut size={14} />
          <span>Lock / Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
