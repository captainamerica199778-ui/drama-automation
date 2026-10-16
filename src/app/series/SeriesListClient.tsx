'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Tv,
  Film,
  ArrowUpRight,
  Search,
  X,
  Edit3,
  SlidersHorizontal,
  Check,
  Image as ImageIcon,
} from 'lucide-react'

const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-400' },
  scheduled: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400 animate-pulse' },
  uploading: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400 animate-pulse' },
  publishing: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400 animate-pulse' },
  published: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  failed: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-400' },
  ready: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-300', dot: 'bg-cyan-400' },
}

const GENRE_SUGGESTIONS = [
  'Romance',
  'Apocalyptic',
  'Harem',
  'Fantasy',
  'Action',
  'Revenge',
  'Urban Billionaire',
  'Sci-Fi',
]

export default function SeriesListClient({ initialSeries }: { initialSeries: any[] }) {
  const [seriesList, setSeriesList] = useState<any[]>(initialSeries)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'published' | 'draft'>('all')

  // Edit Modal State
  const [editingSeries, setEditingSeries] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editGenre, setEditGenre] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCoverUrl, setEditCoverUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const openEditModal = (s: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingSeries(s)
    setEditTitle(s.title || '')
    setEditDescription(s.description || '')
    setEditGenre(s.genre || '')
    setEditTags(s.tags || '')
    setEditCoverUrl(s.coverUrl || '')
    setSaveMsg('')
  }

  const closeEditModal = () => {
    setEditingSeries(null)
    setSaveMsg('')
  }

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSeries) return
    setSaving(true)
    setSaveMsg('')

    try {
      const res = await fetch(`/api/series/${editingSeries.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          genre: editGenre,
          tags: editTags,
          coverUrl: editCoverUrl || null,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSeriesList((prev) =>
          prev.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  title: updated.title,
                  description: updated.description,
                  genre: updated.genre,
                  tags: updated.tags,
                  coverUrl: updated.coverUrl,
                }
              : item
          )
        )
        setSaveMsg('✅ Series updated successfully!')
        setTimeout(() => {
          closeEditModal()
        }, 600)
      } else {
        const data = await res.json()
        setSaveMsg(`❌ ${data.error || 'Failed to update series'}`)
      }
    } catch (err: any) {
      setSaveMsg(`❌ ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Filtered series
  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      // Search matching
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.genre && s.genre.toLowerCase().includes(q)) ||
        (s.tags && s.tags.toLowerCase().includes(q)) ||
        (s.storageAccount?.label && s.storageAccount.label.toLowerCase().includes(q))

      if (!matchesSearch) return false

      // Status filter
      if (filter === 'all') return true
      const publishedCount = s.episodes?.filter((e: any) => e.status === 'published').length || 0
      const totalCount = s.episodes?.length || 0

      if (filter === 'published') {
        return totalCount > 0 && publishedCount === totalCount
      }
      if (filter === 'in_progress') {
        const hasActive = s.episodes?.some((e: any) =>
          ['scheduled', 'uploading', 'publishing', 'ready'].includes(e.status)
        )
        return hasActive || (publishedCount > 0 && publishedCount < totalCount)
      }
      if (filter === 'draft') {
        return totalCount === 0 || s.episodes?.every((e: any) => e.status === 'draft')
      }

      return true
    })
  }, [seriesList, search, filter])

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
            Browse, search, edit metadata, and manage all your drama series and episode release schedules.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> New Series
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search series by title, genre, language, or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input rounded-xl pl-10 pr-9 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Series' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'published', label: 'Completed' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'glass-card text-gray-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {seriesList.length === 0 ? (
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
      ) : filteredSeries.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center border border-white/[0.06]">
          <Search size={28} className="text-gray-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No series match your search</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Try adjusting your search keywords or filter settings.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Grid of Series */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSeries.map((s) => {
            const episodes = s.episodes || []
            const published = episodes.filter((e: any) => e.status === 'published').length
            const total = episodes.length
            const progress = total > 0 ? Math.round((published / total) * 100) : 0
            const uniqueStatuses = [...new Set(episodes.map((e: any) => e.status))]

            // Thumbnail fallback: coverUrl -> first episode thumbnailUrl
            const thumbnail = s.coverUrl || episodes.find((e: any) => e.thumbnailUrl)?.thumbnailUrl

            return (
              <div
                key={s.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/[0.08] hover:border-purple-500/40 transition-all duration-300 relative shadow-lg"
              >
                <div>
                  {/* Poster Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-b from-purple-950/70 via-gray-950 to-black flex items-center justify-center overflow-hidden border-b border-white/[0.06]">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={s.title}
                        onError={(e) => {
                          // If image fails, replace with placeholder UI
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-purple-400/80 p-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Tv size={26} className="text-purple-400" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/60 truncate max-w-[200px]">
                          {s.genre || 'AI Mini Series'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d17] via-transparent to-transparent opacity-90" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {s.genre && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-600/70 text-purple-100 backdrop-blur-md border border-purple-400/30 shadow">
                          {s.genre}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20">
                        {total} Episodes
                      </span>

                      {/* Quick Edit button right on thumbnail */}
                      <button
                        onClick={(e) => openEditModal(s, e)}
                        title="Edit series title & details"
                        className="w-7 h-7 rounded-full bg-black/70 hover:bg-purple-600 text-white/80 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors shadow"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/series/${s.id}`}
                        className="font-bold text-white text-base hover:text-purple-300 transition-colors line-clamp-1"
                      >
                        {s.title}
                      </Link>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 mt-1 min-h-[32px]">
                      {s.description || 'AI drama mini-series registered in the automated publishing network.'}
                    </p>

                    {/* Tags */}
                    {s.tags && (
                      <div className="flex gap-1 flex-wrap mt-2.5">
                        {s.tags.split(',').slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="text-[10px] text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]"
                          >
                            #{t.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-1">
                        <span>Release Progress</span>
                        <span className="text-purple-400">
                          {published}/{total} ({progress}%)
                        </span>
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

                {/* Footer Controls */}
                <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between bg-black/20">
                  <div className="flex gap-1.5 flex-wrap">
                    {uniqueStatuses.slice(0, 2).map((st: any) => {
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => openEditModal(s, e)}
                      className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <Link
                      href={`/series/${s.id}`}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-purple-500/10 transition-colors"
                    >
                      Manage <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Series Modal */}
      {editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/[0.12] p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Series Metadata</h3>
                  <p className="text-xs text-gray-400">Update drama title, description, genre, and thumbnail</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSeries} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Series Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Apocalyptic Wasteland"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Romance, Apocalyptic, Fantasy"
                />
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {GENRE_SUGGESTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGenre(g)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                        editGenre === g
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Brief synopsis or teaser for social media captions…"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. apocalypse, harem, survival, drama"
                />
              </div>

              {/* Cover Image / Thumbnail */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Cover Image / Thumbnail URL
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {editCoverUrl ? (
                      <img
                        src={editCoverUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <ImageIcon size={20} className="text-gray-500" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    className="flex-1 glass-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://.../cover.jpg or R2 public URL"
                  />
                </div>
              </div>

              {saveMsg && (
                <p className="text-xs font-semibold pt-1 text-purple-300">
                  {saveMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white glass-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Check size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
