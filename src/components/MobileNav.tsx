'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Tv, Upload, Link2, HardDrive, Settings } from 'lucide-react'

export default function MobileNav() {
  const path = usePathname()

  const links = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/series', label: 'Series', icon: Tv },
    { href: '/upload', label: 'Upload', icon: Upload, highlight: true },
    { href: '/accounts', label: 'Accounts', icon: Link2 },
    { href: '/storage', label: 'Storage', icon: HardDrive },
  ]

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <div className="glass-panel rounded-2xl border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.7)] px-2 py-1.5 flex justify-between items-center">
        {links.map(({ href, label, icon: Icon, highlight }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))

          if (highlight) {
            return (
              <Link
                key={href}
                href={href}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/40 border border-white/30 group-active:scale-95 transition-transform">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-purple-300 mt-0.5">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 ${
                active ? 'text-purple-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={19} className={active ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' : ''} />
              <span className="text-[10px] mt-1">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
