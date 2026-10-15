'use client'
import { useState, useEffect } from 'react'
import { HardDrive, Cloud, Server, Plus, Trash2, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Database, ExternalLink } from 'lucide-react'

const PROVIDERS = [
  {
    id: 'r2',
    label: 'Cloudflare R2',
    subtitle: 'Zero egress fees · S3 compatible bucket',
    badge: 'Recommended',
    gradient: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/30',
    color: 'text-orange-400',
    fields: ['accountId', 'accessKey', 'secretKey', 'bucket', 'publicUrl'],
  },
  {
    id: 'b2',
    label: 'Backblaze B2',
    subtitle: 'High capacity low-cost cloud storage',
    badge: 'Affordable',
    gradient: 'from-red-500/20 to-rose-500/10',
    border: 'border-red-500/30',
    color: 'text-rose-400',
    fields: ['accessKey', 'secretKey', 'bucket', 'endpoint', 'publicUrl'],
  },
  {
    id: 'minio',
    label: 'MinIO (Self-hosted)',
    subtitle: 'Store files directly on your local VPS or server disk',
    badge: 'Private',
    gradient: 'from-pink-500/20 to-purple-500/10',
    border: 'border-pink-500/30',
    color: 'text-pink-400',
    fields: ['accessKey', 'secretKey', 'bucket', 'endpoint', 'publicUrl'],
  },
]

const FIELD_CONFIG: Record<string, { label: string; placeholder: string; hint?: string }> = {
  accountId: { label: 'Cloudflare Account ID', placeholder: 'e.g. 9b88234857b68e918274a123' },
  accessKey: { label: 'Access Key ID', placeholder: 'e.g. 719283749817293847' },
  secretKey: { label: 'Secret Access Key', placeholder: 'e.g. a87df98a7sdf98a7sdf98a7sdf98' },
  bucket: { label: 'Bucket Name', placeholder: 'e.g. drama-episodes-raw' },
  endpoint: { label: 'Custom S3 Endpoint URL', placeholder: 'https://s3.us-west-004.backblazeb2.com or http://localhost:9000' },
  publicUrl: { label: 'Public CDN / Custom Domain URL (optional)', placeholder: 'https://cdn.mydrama.com', hint: 'Used to stream or serve video preview links directly.' },
}

export default function StorageClient({ accounts }: { accounts: any[] }) {
  const [localAccounts, setLocalAccounts] = useState(accounts || [])
  const [provider, setProvider] = useState('r2')
  const [label, setLabel] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/storage')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLocalAccounts(data)
        }
      })
      .catch(() => {})
  }, [])

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!

  const handleTest = async () => {
    setTesting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...form }),
      })
      const data = await res.json()
      setMsg({ text: data.message || (data.ok ? 'Connection verified!' : 'Connection failed'), ok: !!data.ok })
    } catch (e: any) {
      setMsg({ text: e.message || 'Network test error', ok: false })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!label) {
      setMsg({ text: 'Please enter a bucket label/name.', ok: false })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, label, ...form }),
      })
      const data = await res.json()
      setSaving(false)
      if (res.ok) {
        setLocalAccounts((p) => [...p, data])
        setMsg({ text: 'Storage account saved successfully!', ok: true })
        setForm({})
        setLabel('')
      } else {
        setMsg({ text: data.error || 'Failed to save storage account', ok: false })
      }
    } catch (e: any) {
      setSaving(false)
      setMsg({ text: e.message, ok: false })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this storage integration?')) return
    await fetch(`/api/storage/${id}`, { method: 'DELETE' })
    setLocalAccounts((p) => p.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
          <Database size={13} className="text-purple-400" />
          S3-Compatible Cloud & Edge Storage
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Storage Buckets
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Store your high-resolution AI drama video files in Cloudflare R2 ($0 egress), Backblaze B2, or self-hosted MinIO.
        </p>
      </div>

      {/* Connected Storage Buckets */}
      {localAccounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Connected Storage Pools ({localAccounts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {localAccounts.map((acc) => {
              const prov = PROVIDERS.find((p) => p.id === acc.provider) || PROVIDERS[0]
              return (
                <div
                  key={acc.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/[0.08]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${prov.gradient} border ${prov.border} flex items-center justify-center ${prov.color} shrink-0`}>
                      <HardDrive size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{acc.label}</div>
                      <div className="text-xs text-gray-400">
                        {acc.provider.toUpperCase()} · <span className="font-mono text-gray-300">{acc.bucket}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Bucket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Storage Form */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-purple-400" />
          Add Storage Account
        </h2>

        {/* Provider Select Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {PROVIDERS.map((p) => {
            const isSelected = provider === p.id
            return (
              <div
                key={p.id}
                onClick={() => {
                  setProvider(p.id)
                  setForm({})
                  setMsg(null)
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? `bg-purple-600/15 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]`
                    : 'glass-card border-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {p.label}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-purple-300">
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{p.subtitle}</p>
              </div>
            )
          })}
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Storage Pool Label <span className="text-purple-400">*</span>
            </label>
            <input
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Cloudflare R2 Primary Bucket"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedProvider.fields.map((field) => {
              const cfg = FIELD_CONFIG[field] || { label: field, placeholder: field }
              const isSecret = field.toLowerCase().includes('secret')
              return (
                <div key={field} className={field === 'endpoint' || field === 'publicUrl' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-medium text-gray-400 block mb-1">{cfg.label}</label>
                  <input
                    type={isSecret ? 'password' : 'text'}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    value={form[field] || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={cfg.placeholder}
                  />
                  {cfg.hint && <p className="text-[11px] text-gray-500 mt-1">{cfg.hint}</p>}
                </div>
              )
            })}
          </div>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                msg.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              {msg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {msg.text}
            </div>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="glass-card hover:bg-white/[0.08] disabled:opacity-50 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {testing ? 'Testing Endpoint…' : 'Test Connection'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              {saving ? 'Saving…' : 'Save Storage Pool'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
