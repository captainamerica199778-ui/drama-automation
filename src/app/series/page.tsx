import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Tv, Film, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-400' },
  scheduled: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400 animate-pulse' },
  uploading: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400 animate-pulse' },
  publishing: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400 animate-pulse' },
  published: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  failed: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-400' },
  ready: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-300', dot: 'bg-cyan-400' },
}

export default async function SeriesPage() {
  const series = await prisma.series.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      episodes: { orderBy: { episodeNumber: 'asc' } },
      storageAccount: { select: { label: true, provider: true } },
    },
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
            <Film size={13} className="text-purple-400" />
            Drama Library
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI Drama Series
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Browse and manage all episodic AI mini-series, storage allocations, and release timetables.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> New Series
        </Link>
      </div>

      {series.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border-dashed border border-white/[0.1]">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">
            <Tv size={32} />
          </div>
          <h3 className="text-base font-semibold text-white">No series uploaded yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1 mb-6">
            Upload episodes in batch to store in Cloudflare R2 and schedule auto-distribution.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/25"
          >
            <Plus size={16} /> Upload First Drama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {series.map((s) => {
            const published = s.episodes.filter((e) => e.status === 'published').length
            const total = s.episodes.length
            const progress = total > 0 ? Math.round((published / total) * 100) : 0
            const uniqueStatuses = [...new Set(s.episodes.map((e) => e.status))]

            return (
              <Link
                key={s.id}
                href={`/series/${s.id}`}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/[0.08] hover:border-purple-500/40 transition-all duration-300"
              >
                <div>
                  {/* Poster / Header */}
                  <div className="relative h-44 bg-gradient-to-b from-purple-950/60 to-gray-950 flex items-center justify-center overflow-hidden border-b border-white/[0.06]">
                    {s.coverUrl ? (
                      <img
                        src={s.coverUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={s.title}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-purple-400/80">
                        <Tv size={36} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/60">AI Mini Series</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d17] via-transparent to-transparent opacity-80" />

                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full glass-panel text-white border border-white/20">
                        {total} Episodes
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h2 className="font-bold text-white text-base truncate group-hover:text-purple-300 transition-colors">
                      {s.title}
                    </h2>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                      {s.description || 'AI drama mini-series queued for distribution.'}
                    </p>

                    {/* Storage tag */}
                    {s.storageAccount && (
                      <div className="text-[11px] text-gray-500 mt-2 font-mono">
                        Storage: {s.storageAccount.label} ({s.storageAccount.provider.toUpperCase()})
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-1">
                        <span>Publish Progress</span>
                        <span className="text-purple-400">{published}/{total} ({progress}%)</span>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between bg-black/20">
                  <div className="flex gap-1.5 flex-wrap">
                    {uniqueStatuses.slice(0, 2).map((st) => {
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
                  </div>
                  <span className="text-xs font-semibold text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                    Manage <ArrowUpRight size={13} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
