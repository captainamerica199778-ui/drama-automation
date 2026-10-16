'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  HardDrive,
  Film,
  Plus,
  CheckSquare,
  Square,
  AlertTriangle,
  Edit3,
  Check,
  X,
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

export default function SeriesDetailClient({ initialSeries }: { initialSeries: any }) {
  const router = useRouter()
  const [series, setSeries] = useState(initialSeries)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(initialSeries.title || '')
  const [editDescription, setEditDescription] = useState(initialSeries.description || '')
  const [editGenre, setEditGenre] = useState(initialSeries.genre || '')
  const [editTags, setEditTags] = useState(initialSeries.tags || '')
  const [editCoverUrl, setEditCoverUrl] = useState(initialSeries.coverUrl || '')
  const [savingEdit, setSavingEdit] = useState(false)

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/series/${series.id}`, {
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
        setSeries((prev: any) => ({
          ...prev,
          title: updated.title,
          description: updated.description,
          genre: updated.genre,
          tags: updated.tags,
          coverUrl: updated.coverUrl,
        }))
        setIsEditing(false)
        setMsg('✅ Series details updated successfully!')
      } else {
        const errData = await res.json()
        setMsg(`❌ ${errData.error || 'Failed to update'}`)
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
    } finally {
      setSavingEdit(false)
    }
  }

  const episodes = series.episodes || []
  const published = episodes.filter((e: any) => e.status === 'published').length
  const total = episodes.length
  const progressPct = total > 0 ? Math.round((published / total) * 100) : 0

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === episodes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(episodes.map((e: any) => e.id))
    }
  }

  // Delete a single episode
  const handleDeleteEpisode = async (epId: string, epNum: number) => {
    if (!confirm(`Are you sure you want to delete Episode ${epNum}? This also removes its file from Cloudflare R2.`)) {
      return
    }

    setDeleting(true)
    setMsg('')
    try {
      const res = await fetch(`/api/episodes/${epId}`, { method: 'DELETE' })
      if (res.ok) {
        setSeries((prev: any) => ({
          ...prev,
          episodes: prev.episodes.filter((e: any) => e.id !== epId),
        }))
        setSelectedIds((prev) => prev.filter((id) => id !== epId))
        setMsg(`✅ Episode ${epNum} deleted from storage and database.`)
      } else {
        const data = await res.json()
        setMsg(`❌ Error: ${data.error}`)
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Delete selected episodes
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} selected episode(s) from storage and database?`)) {
      return
    }

    setDeleting(true)
    setMsg('')
    try {
      const res = await fetch(`/api/series/${series.id}/episodes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeIds: selectedIds }),
      })
      if (res.ok) {
        setSeries((prev: any) => ({
          ...prev,
          episodes: prev.episodes.filter((e: any) => !selectedIds.includes(e.id)),
        }))
        setSelectedIds([])
        setMsg(`✅ ${selectedIds.length} episodes deleted from storage and database.`)
      } else {
        const data = await res.json()
        setMsg(`❌ Error: ${data.error}`)
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Delete all episodes together
  const handleDeleteAllEpisodes = async () => {
    if (episodes.length === 0) return
    if (!confirm(`⚠️ Are you sure you want to delete ALL ${episodes.length} episodes in this series? All video files will be permanently purged from Cloudflare R2.`)) {
      return
    }

    setDeleting(true)
    setMsg('')
    try {
      const res = await fetch(`/api/series/${series.id}/episodes`, { method: 'DELETE' })
      if (res.ok) {
        setSeries((prev: any) => ({
          ...prev,
          episodes: [],
        }))
        setSelectedIds([])
        setMsg(`✅ All episodes deleted from storage.`)
      } else {
        const data = await res.json()
        setMsg(`❌ Error: ${data.error}`)
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Delete whole series
  const handleDeleteSeries = async () => {
    if (!confirm(`⚠️ Permanently delete the entire series "${series.title}" along with all files and schedules?`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/series/${series.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/series')
      } else {
        const data = await res.json()
        setMsg(`❌ Error: ${data.error}`)
        setDeleting(false)
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Link
          href="/series"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white glass-card px-3.5 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft size={14} /> Back to All Series
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white glass-card hover:bg-purple-600/20 px-3.5 py-1.5 rounded-xl border border-purple-500/30 transition-colors shadow"
          >
            <Edit3 size={13} /> Edit Series
          </button>
          <button
            onClick={handleDeleteSeries}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-200 glass-card hover:bg-rose-500/10 px-3.5 py-1.5 rounded-xl border border-rose-500/20 transition-colors"
          >
            <Trash2 size={13} /> Delete Entire Series
          </button>
        </div>
      </div>

      {/* Series Hero Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-violet-700 p-0.5 shadow-xl shadow-purple-500/20 shrink-0">
            <div className="w-full h-full bg-[#0d0f1a] rounded-[14px] flex items-center justify-center overflow-hidden">
              {(series.coverUrl || episodes.find((e: any) => e.thumbnailUrl)?.thumbnailUrl) ? (
                <img
                  src={series.coverUrl || episodes.find((e: any) => e.thumbnailUrl)?.thumbnailUrl}
                  className="w-full h-full object-cover"
                  alt={series.title}
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <Film size={36} className="text-purple-400" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
              Series Detail
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
              {series.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              {series.description || 'AI drama video series registered in the automated publishing network.'}
            </p>

            <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-gray-400">
              <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                <Film size={14} className="text-purple-400" />
                {total} Episodes ({published} Published)
              </span>
              {series.storageAccount && (
                <span className="flex items-center gap-1.5 font-mono text-gray-300">
                  <HardDrive size={14} className="text-amber-400" />
                  {series.storageAccount.label} ({series.storageAccount.provider.toUpperCase()})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-1.5">
            <span>Overall Publish Progress</span>
            <span className="text-purple-400">{progressPct}%</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl glass-card text-xs font-semibold text-purple-200 border border-purple-500/30">
          {msg}
        </div>
      )}

      {/* Episodes Header & Batch Actions */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Episodes ({episodes.length})
            </h2>

            {episodes.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 glass-card px-2.5 py-1 rounded-lg"
              >
                {selectedIds.length === episodes.length ? (
                  <>
                    <CheckSquare size={14} className="text-purple-400" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square size={14} /> Select All
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Trash2 size={13} />
                Delete Selected ({selectedIds.length})
              </button>
            )}

            {episodes.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllEpisodes}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-rose-400 glass-card px-3 py-1.5 rounded-xl transition-colors"
              >
                <Trash2 size={13} />
                Delete All Episodes
              </button>
            )}

            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus size={14} /> Upload More
            </Link>
          </div>
        </div>

        {episodes.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border-dashed border border-white/[0.1]">
            <p className="text-sm text-gray-400">No episodes in this series.</p>
            <Link href="/upload" className="mt-3 inline-block text-xs font-semibold text-purple-400 underline">
              Upload episodes now →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {episodes.map((ep: any) => {
              const badge = statusBadge[ep.status] || statusBadge.draft
              const isSelected = selectedIds.includes(ep.id)

              return (
                <div
                  key={ep.id}
                  className={`glass-card rounded-2xl p-4 flex items-center gap-3.5 border transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-600/10 border-purple-500/40'
                      : 'border-white/[0.08] hover:border-purple-500/30'
                  }`}
                >
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelect(ep.id)}
                    className="text-gray-400 hover:text-white shrink-0 p-1"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-purple-400" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>

                  {/* Episode Number */}
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-sm text-purple-300 shrink-0">
                    {ep.episodeNumber}
                  </div>

                  {/* Title & Storage Link */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {ep.title || `Episode ${ep.episodeNumber}`}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      {ep.fileSize && (
                        <span>{(ep.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                      )}
                      {ep.r2Url && (
                        <a
                          href={ep.r2Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                        >
                          Storage Preview <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {ep.status}
                    </span>
                  </div>

                  {/* Single Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteEpisode(ep.id, ep.episodeNumber)}
                    disabled={deleting}
                    className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title={`Delete Episode ${ep.episodeNumber}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Series Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/[0.12] p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Series Details</h3>
                  <p className="text-xs text-gray-400">Update drama title, description, genre, and thumbnail</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Series Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

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

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white glass-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Check size={14} /> {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
