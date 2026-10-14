import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Tv, Calendar, CloudUpload, Zap, Plus, ArrowUpRight, Film, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
  let totalSeries = 0
  let scheduledJobs = 0
  let uploadingEps = 0
  let activeJobs = 0
  let recentSeries: any[] = []

  try {
    const results = await Promise.all([
      prisma.series.count(),
      prisma.scheduledJob.count({ where: { status: 'pending' } }),
      prisma.episode.count({ where: { status: 'uploading' } }),
      prisma.scheduledJob.count({ where: { status: 'processing' } }),
      prisma.series.findMany({
        take: 12,
        orderBy: { updatedAt: 'desc' },
        include: { episodes: true },
      }),
    ])
    totalSeries = results[0]
    scheduledJobs = results[1]
    uploadingEps = results[2]
    activeJobs = results[3]
    recentSeries = results[4]
  } catch (err) {
    console.warn('Database query during page load fell back to empty defaults:', err)
  }

  const stats = [
    {
      label: 'Total Series',
      value: totalSeries,
      icon: Film,
      gradient: 'from-purple-500/20 to-indigo-500/10',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      glow: 'shadow-purple-500/10',
    },
    {
      label: 'Scheduled Posts',
      value: scheduledJobs,
      icon: Calendar,
      gradient: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      glow: 'shadow-amber-500/10',
    },
    {
      label: 'In Storage Pipeline',
      value: uploadingEps,
      icon: CloudUpload,
      gradient: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      glow: 'shadow-blue-500/10',
    },
    {
      label: 'Active Job Queue',
      value: activeJobs,
      icon: Zap,
      gradient: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
  ]

  const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-400' },
    scheduled: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400 animate-pulse' },
    uploading: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400 animate-pulse' },
    publishing: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400 animate-pulse' },
    published: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
    failed: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-400' },
    ready: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
            <Sparkles size={13} className="text-purple-400" />
            AI Drama Publishing Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Control Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Orchestrate batch uploads, multi-cloud storage, and timed distribution across all platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98] transition-all"
          >
            <Plus size={17} />
            <span>New Series</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, gradient, border, iconColor, glow }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl glass-panel p-5 border ${border} ${glow} transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} blur-xl`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                <div className={`p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] ${iconColor}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-white">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad */}
      <div className="p-4 rounded-2xl glass-card border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap size={20} />
          </div>
          <div>
            <div className="font-semibold text-sm text-white">Automated Cross-Posting Hub</div>
            <div className="text-xs text-gray-400">Upload entire drama folders at once and schedule multi-platform posts.</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/accounts"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium glass-card hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors"
          >
            Social Accounts →
          </Link>
          <Link
            href="/storage"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium glass-card hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors"
          >
            R2 / B2 Storage →
          </Link>
          <Link
            href="/settings"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium glass-card hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors"
          >
            Telegram Alerts →
          </Link>
        </div>
      </div>

      {/* Recent Series Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film size={18} className="text-purple-400" />
              Active Series
            </h2>
            <p className="text-xs text-gray-400">Recent drama projects and their distribution progress.</p>
          </div>
          <Link
            href="/series"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium group"
          >
            View All Series <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {recentSeries.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border-dashed border border-white/[0.1]">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">
              <Tv size={32} />
            </div>
            <h3 className="text-base font-semibold text-white">No series uploaded yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1 mb-6">
              Upload your AI drama series episodes in batch. You can attach Cloudflare R2 and schedule auto-posting.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/25"
            >
              <Plus size={16} /> Upload First Series
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSeries.map((s: any) => {
              const eps = Array.isArray(s.episodes) ? s.episodes : []
              const publishedCount = eps.filter((e: any) => e.status === 'published').length
              const totalEp = eps.length
              const progressPct = totalEp > 0 ? Math.round((publishedCount / totalEp) * 100) : 0
              const uniqueStatuses: string[] = Array.from(new Set(eps.map((e: any) => String(e.status))))

              return (
                <Link
                  key={s.id}
                  href={`/series/${s.id}`}
                  className="glass-card rounded-2xl p-4 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="w-14 h-14 rounded-xl bg-purple-950/40 border border-purple-500/20 overflow-hidden flex items-center justify-center shrink-0">
                        {s.coverUrl ? (
                          <img src={s.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={s.title} />
                        ) : (
                          <Tv size={22} className="text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-base truncate group-hover:text-purple-300 transition-colors">
                          {s.title}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {s.description || 'AI drama mini-series'}
                        </div>
                        <div className="text-[11px] font-medium text-purple-400 mt-1">
                          {totalEp} Episodes · {publishedCount} Published
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div className="flex gap-1.5 flex-wrap">
                      {uniqueStatuses.slice(0, 2).map((st: string) => {
                        const style = statusBadge[st] || statusBadge.draft
                        return (
                          <span
                            key={st}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.text}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                            {st}
                          </span>
                        )
                      })}
                      {uniqueStatuses.length > 2 && (
                        <span className="text-[10px] text-gray-500 self-center">+{uniqueStatuses.length - 2}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-white flex items-center gap-0.5">
                      View <ArrowUpRight size={12} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
