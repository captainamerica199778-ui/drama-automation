'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, FolderOpen, CheckCircle, XCircle, Clock } from 'lucide-react'

type EpisodeFile = {
  file: File
  episodeNumber: number
  title: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
  savedId?: string
}

function detectEpisodeNumber(name: string): number {
  const m = name.match(/(?:ep|episode|e)[\s._-]?(\d{1,3})/i) || name.match(/(\d{1,3})/i)
  return m ? parseInt(m[1]) : 0
}

export default function UploadClient({
  series,
  storageAccounts,
  socialAccounts,
}: {
  series: any[]
  storageAccounts: any[]
  socialAccounts: any[]
}) {
  const [seriesId, setSeriesId] = useState('')
  const [newSeriesTitle, setNewSeriesTitle] = useState('')
  const [seriesDescription, setSeriesDescription] = useState('')
  const [seriesTags, setSeriesTags] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [storageAccountId, setStorageAccountId] = useState('')
  const [localAccounts, setLocalAccounts] = useState<any[]>(storageAccounts || [])
  const [episodes, setEpisodes] = useState<EpisodeFile[]>([])

  useEffect(() => {
    fetch('/api/storage')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocalAccounts(data)
          setStorageAccountId((curr) => {
            if (curr) return curr
            const defaultAcc = data.find((a: any) => a.isDefault) || data[0]
            return defaultAcc ? defaultAcc.id : ''
          })
        }
      })
      .catch(() => {})
  }, [])
  const [scheduleTargets, setScheduleTargets] = useState<string[]>([])
  const [startAt, setStartAt] = useState('')
  const [intervalHours, setIntervalHours] = useState(24)
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [msg, setMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const videoFiles = Array.from(files).filter((f) => f.type.startsWith('video/'))
    const mapped: EpisodeFile[] = videoFiles
      .map((f) => ({
        file: f,
        episodeNumber: detectEpisodeNumber(f.name),
        title: f.name.replace(/\.[^.]+$/, ''),
        status: 'pending' as const,
        progress: 0,
      }))
      .sort((a, b) => a.episodeNumber - b.episodeNumber)
    setEpisodes(mapped)
  }

  const handleUploadAll = async () => {
    if (!seriesId && !newSeriesTitle) { setMsg('Please select or create a series.'); return }
    if (!storageAccountId) { setMsg('Please select a storage account.'); return }
    setUploading(true)

    let activeSeriesId = seriesId
    // Create series if new
    if (!activeSeriesId && newSeriesTitle) {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSeriesTitle,
          description: seriesDescription,
          tags: seriesTags,
          storageAccountId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(`❌ ${data.error}`); setUploading(false); return }
      activeSeriesId = data.id
    }

    // Upload series cover thumbnail once if provided
    let uploadedThumbnailUrl = ''
    if (thumbnailFile) {
      try {
        const presignThumbRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seriesId: activeSeriesId,
            fileName: `cover_${thumbnailFile.name}`,
            contentType: thumbnailFile.type || 'image/jpeg',
          }),
        })
        if (presignThumbRes.ok) {
          const { uploadUrl, publicUrl } = await presignThumbRes.json()
          await fetch(uploadUrl, {
            method: 'PUT',
            body: thumbnailFile,
            headers: { 'Content-Type': thumbnailFile.type || 'image/jpeg' },
          })
          uploadedThumbnailUrl = publicUrl
        }
      } catch (e) {
        console.warn('Thumbnail presign upload notice:', e)
      }
    }

    let successCount = 0
    // Upload each episode directly to Cloudflare R2 / S3
    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i]
      if (ep.status === 'done') {
        successCount++
        continue
      }

      setEpisodes((prev) =>
        prev.map((e, idx) => (idx === i ? { ...e, status: 'uploading', progress: 5, error: undefined } : e))
      )

      try {
        // Step 1: Request presigned direct upload URL
        const presignRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seriesId: activeSeriesId,
            fileName: ep.file.name,
            contentType: ep.file.type || 'video/mp4',
          }),
        })

        if (!presignRes.ok) {
          const errData = await presignRes.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to initialize direct upload')
        }

        const { uploadUrl, key, publicUrl } = await presignRes.json()

        // Step 2: Stream directly from browser to Cloudflare R2 with progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', ep.file.type || 'video/mp4')

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const pct = Math.min(99, Math.round((event.loaded / event.total) * 100))
              setEpisodes((prev) =>
                prev.map((e, idx) => (idx === i ? { ...e, progress: pct } : e))
              )
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Storage returned HTTP ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('Direct storage upload failed. Please verify bucket CORS in Cloudflare.'))
          xhr.ontimeout = () => reject(new Error('Direct upload timed out.'))
          xhr.send(ep.file)
        })

        // Step 3: Register completed episode into database
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seriesId: activeSeriesId,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: seriesDescription,
            tags: seriesTags,
            thumbnailUrl: uploadedThumbnailUrl || undefined,
            r2Key: key,
            r2Url: publicUrl,
            fileSize: ep.file.size,
          }),
        })

        if (!completeRes.ok) {
          const cData = await completeRes.json().catch(() => ({}))
          throw new Error(cData.error || 'Failed to save episode details')
        }

        const savedEp = await completeRes.json()
        successCount++
        setEpisodes((prev) =>
          prev.map((e, idx) =>
            idx === i ? { ...e, status: 'done', progress: 100, savedId: savedEp.id } : e
          )
        )
      } catch (err: any) {
        console.error(`Upload error for ep ${ep.episodeNumber}:`, err)
        setEpisodes((prev) =>
          prev.map((e, idx) =>
            idx === i ? { ...e, status: 'error', error: err.message || 'Upload failed' } : e
          )
        )
      }
    }

    setUploading(false)
    if (successCount > 0) {
      setStep(3)
      setMsg('')
    } else {
      setMsg('❌ Upload failed. If using Cloudflare R2, make sure your bucket CORS policy allows PUT requests.')
    }
  }

  const doneEpisodeIds = episodes.filter((e) => e.status === 'done' && e.savedId).map((e) => e.savedId!)

  const handleSchedule = async () => {
    if (!scheduleTargets.length) { setMsg('Select at least one target account.'); return }
    if (!startAt) { setMsg('Set a start date/time.'); return }
    setScheduling(true)

    // Get episode IDs from DB (simplified: we pass all ep numbers + seriesId)
    const seriesRes = await fetch(`/api/series/${seriesId || 'new'}`)
    // For now send to schedule endpoint
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        episodeIds: doneEpisodeIds,
        socialAccountIds: scheduleTargets,
        startAt,
        intervalHours,
      }),
    })

    setScheduling(false)
    const data = await res.json()
    if (res.ok) setMsg(`✅ ${data.jobs?.length || 0} jobs scheduled!`)
    else setMsg(`❌ ${data.error}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
          <Upload size={13} className="text-purple-400" />
          Batch Episode Pipeline
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Upload & Schedule
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload whole drama series folders to Cloudflare R2 / S3 storage and program timed multi-platform posting.
        </p>
      </div>

      {/* Modern Stepper */}
      <div className="glass-panel rounded-2xl p-2.5 flex items-center justify-between border border-white/[0.08]">
        {[
          { num: 1, label: 'Series Info' },
          { num: 2, label: 'Batch Upload' },
          { num: 3, label: 'Distribution & Schedule' },
        ].map(({ num, label }) => {
          const isActive = step === num
          const isDone = step > num
          return (
            <button
              key={num}
              onClick={() => setStep(num)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : isDone
                  ? 'text-purple-300 hover:text-white bg-white/[0.03]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isActive ? 'bg-white text-purple-700' : isDone ? 'bg-purple-500/30 text-purple-300' : 'bg-gray-800 text-gray-500'
              }`}>
                {isDone ? '✓' : num}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Step 1: Series Info */}
      {step === 1 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-5 animate-in fade-in duration-300">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">Existing Series or Create New</label>
            <select
              className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
            >
              <option value="" className="bg-gray-900 text-gray-300">— Create New Drama Series —</option>
              {series.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                  {s.title} ({s.episodes?.length || 0} eps)
                </option>
              ))}
            </select>
          </div>

          {!seriesId && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  New Series Title <span className="text-purple-400">*</span>
                </label>
                <input
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder="e.g. The CEO's Secret Heiress"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Description / Video Caption Template
                </label>
                <textarea
                  rows={2}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={seriesDescription}
                  onChange={(e) => setSeriesDescription(e.target.value)}
                  placeholder="e.g. When the heiress returns disguised as a maid... Watch every episode daily!"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Tags & Hashtags (comma separated)
                </label>
                <input
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={seriesTags}
                  onChange={(e) => setSeriesTags(e.target.value)}
                  placeholder="e.g. aidrama, shortdrama, billionaire, reels, tiktok"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Thumbnail / Cover Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full glass-input rounded-xl px-4 py-2 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Storage Bucket Destination <span className="text-purple-400">*</span>
            </label>
            <select
              className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
              value={storageAccountId}
              onChange={(e) => setStorageAccountId(e.target.value)}
            >
              <option value="" className="bg-gray-900 text-gray-300">Select target bucket…</option>
              {localAccounts.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                  {s.label} ({s.provider.toUpperCase()} · {s.bucket})
                </option>
              ))}
            </select>
            {localAccounts.length === 0 && (
              <p className="text-xs text-amber-400 mt-1.5">
                No storage account connected. <a href="/storage" className="underline font-semibold">Connect Cloudflare R2 or B2 first →</a>
              </p>
            )}
          </div>

          {msg && <p className="text-xs text-rose-400">{msg}</p>}

          <div className="pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={(!seriesId && !newSeriesTitle) || !storageAccountId}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
            >
              Next: Select Episodes & Upload →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Episodes */}
      {step === 2 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-6 animate-in fade-in duration-300">
          {/* Dropzone */}
          <div
            className="border-2 border-dashed border-white/[0.15] hover:border-purple-500/60 rounded-2xl p-10 text-center glass-card hover:bg-white/[0.03] transition-all cursor-pointer group"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <FolderOpen size={30} />
            </div>
            <p className="text-base font-bold text-white">Drop drama video files or folder here</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Click to select files. Auto-detects episode numbers from names like <span className="text-purple-300 font-mono">Ep 01.mp4</span>, <span className="text-purple-300 font-mono">Episode_2.mp4</span>.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Episode List */}
          {episodes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Queued Episodes ({episodes.length})
                </span>
                <span className="text-xs text-purple-400 font-medium">
                  Total Size: {(episodes.reduce((acc, curr) => acc + curr.file.size, 0) / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {episodes.map((ep, i) => (
                  <div key={i} className="glass-card rounded-xl p-3 flex items-center gap-3 border border-white/[0.06]">
                    <div className="shrink-0 w-7 flex items-center justify-center">
                      {ep.status === 'done' && <CheckCircle size={18} className="text-emerald-400" />}
                      {ep.status === 'error' && <XCircle size={18} className="text-rose-400" />}
                      {ep.status === 'uploading' && (
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {ep.status === 'pending' && <Clock size={18} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{ep.title}</div>
                      <div className="text-xs text-gray-400">
                        {(ep.file.size / 1024 / 1024).toFixed(1)} MB · Status: {ep.status}
                        {ep.status === 'uploading' && ` (${ep.progress || 0}%)`}
                        {ep.status === 'error' && ep.error && (
                          <span className="text-rose-400 block mt-0.5 truncate">{ep.error}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">Ep #</span>
                      <input
                        type="number"
                        min={1}
                        value={ep.episodeNumber}
                        onChange={(e) => setEpisodes((prev) => prev.map((x, idx) => idx === i ? { ...x, episodeNumber: parseInt(e.target.value) || 1 } : x))}
                        className="w-16 glass-input rounded-lg px-2.5 py-1 text-xs text-white text-center font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {msg && <p className="text-xs text-purple-300">{msg}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleUploadAll}
              disabled={uploading || episodes.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Upload size={17} />
              {uploading ? 'Uploading to Storage…' : `Upload ${episodes.length} Episodes to Storage`}
            </button>
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white glass-card"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Distribution & Scheduling */}
      {step === 3 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-6 animate-in fade-in duration-300">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">Target Platforms</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {socialAccounts.map((acc) => {
                const isSelected = scheduleTargets.includes(acc.id)
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setScheduleTargets((p) => isSelected ? p.filter((id) => id !== acc.id) : [...p, acc.id])
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/60 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]'
                        : 'glass-card border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">{acc.label}</div>
                      <div className="text-xs text-gray-400 capitalize">{acc.platform}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-white/[0.2]'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                )
              })}
            </div>
            {socialAccounts.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">
                No social media accounts connected. <a href="/accounts" className="underline font-semibold">Connect accounts first →</a>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">First Episode Date & Time</label>
              <input
                type="datetime-local"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">Posting Interval (hours)</label>
              <input
                type="number"
                min={0}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                value={intervalHours}
                onChange={(e) => setIntervalHours(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Interval Presets</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Every 2 Hours', val: 2 },
                { label: 'Every 4 Hours', val: 4 },
                { label: 'Every 6 Hours', val: 6 },
                { label: 'Daily (24 Hours)', val: 24 },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setIntervalHours(val)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    intervalHours === val ? 'bg-purple-600 text-white' : 'glass-card text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {msg && <p className="text-sm font-semibold text-purple-300">{msg}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSchedule}
              disabled={scheduling}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              {scheduling ? 'Scheduling Jobs…' : '🚀 Schedule Auto-Publishing'}
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white glass-card"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
