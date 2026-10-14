'use client'
import { useState } from 'react'
import { Radio, Video, Plus, Trash2, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

function YoutubeIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function InstagramIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

function FacebookIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function TikTokIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.78a8.28 8.28 0 0 0 4.84 1.54V6.87a4.83 4.83 0 0 1-.94-.18z"/>
    </svg>
  )
}

function RumbleIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
    </svg>
  )
}

type Platform = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'rumble'

const PLATFORMS: {
  id: Platform
  label: string
  subtitle: string
  icon: any
  gradient: string
  border: string
  glow: string
  badgeBg: string
  fields: { key: string; label: string; placeholder: string; type?: string; hint?: string }[]
}[] = [
  {
    id: 'youtube',
    label: 'YouTube Shorts & Videos',
    subtitle: 'Upload full dramas & episodic shorts via YouTube Data API v3',
    icon: YoutubeIcon,
    gradient: 'from-red-600/20 via-rose-500/10 to-transparent',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/10',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
    fields: [
      { key: 'channelName', label: 'Channel Name / Handle', placeholder: '@AIDramaSeries' },
      { key: 'clientId', label: 'Google OAuth Client ID', placeholder: 'xxxx.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'GOCSPX-xxxx', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token (optional)', placeholder: '1//04xxxx', type: 'password', hint: 'Allows automated background uploads without manual login.' },
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram Reels',
    subtitle: 'Publish vertical 9:16 reels directly to your Instagram Creator or Business page',
    icon: InstagramIcon,
    gradient: 'from-pink-600/20 via-purple-500/10 to-transparent',
    border: 'border-pink-500/30',
    glow: 'shadow-pink-500/10',
    badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    fields: [
      { key: 'accountId', label: 'Instagram Business Account ID', placeholder: '17841400000000' },
      { key: 'accessToken', label: 'Long-Lived Page Access Token', placeholder: 'EAAxxxx', type: 'password' },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook Pages & Reels',
    subtitle: 'Distribute episodes to Facebook Page Video Library and Reels',
    icon: FacebookIcon,
    gradient: 'from-blue-600/20 via-indigo-500/10 to-transparent',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    fields: [
      { key: 'pageId', label: 'Facebook Page ID', placeholder: '1092837465928' },
      { key: 'accessToken', label: 'Page Access Token', placeholder: 'EAAxxxx', type: 'password' },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok Creator Content',
    subtitle: 'Direct publishing via TikTok Content Posting API',
    icon: TikTokIcon,
    gradient: 'from-cyan-600/20 via-teal-500/10 to-transparent',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/10',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    fields: [
      { key: 'clientKey', label: 'TikTok Client Key', placeholder: 'awxxxx' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'xxxx', type: 'password' },
      { key: 'accessToken', label: 'User Access Token', placeholder: 'act.xxxx', type: 'password' },
    ],
  },
  {
    id: 'rumble',
    label: 'Rumble Video',
    subtitle: 'Publish drama episodes to Rumble channels',
    icon: RumbleIcon,
    gradient: 'from-emerald-600/20 via-green-500/10 to-transparent',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fields: [
      { key: 'channelId', label: 'Rumble Channel ID', placeholder: 'c-1234567' },
      { key: 'apiKey', label: 'API Key / Upload Key', placeholder: 'rumble_api_xxxx', type: 'password' },
    ],
  },
]

interface AccountFormProps {
  platform: typeof PLATFORMS[0]
  onSave: (data: any) => void
  onCancel: () => void
}

function AccountForm({ platform, onSave, onCancel }: AccountFormProps) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    if (!label) {
      setMsg('Please enter an account nickname/label.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platform.id, label, ...form }),
      })
      const data = await res.json()
      setSaving(false)
      if (res.ok) {
        setMsg('✅ Account connected successfully!')
        onSave(data)
      } else {
        setMsg(`❌ ${data.error || 'Failed to save account'}`)
      }
    } catch (e: any) {
      setSaving(false)
      setMsg(`❌ ${e.message}`)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in duration-300">
      <div>
        <label className="text-xs font-semibold text-gray-300 block mb-1">
          Account Nickname <span className="text-purple-400">*</span>
        </label>
        <input
          className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Drama Page US - Primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {platform.fields.map((f) => (
          <div key={f.key} className={f.key.toLowerCase().includes('token') ? 'sm:col-span-2' : ''}>
            <label className="text-xs font-medium text-gray-400 block mb-1">{f.label}</label>
            <input
              type={f.type || 'text'}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
              value={form[f.key] || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
            {f.hint && <p className="text-[11px] text-gray-500 mt-1">{f.hint}</p>}
          </div>
        ))}
      </div>

      {msg && <p className="text-xs font-medium text-purple-300">{msg}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
        >
          {saving ? 'Connecting…' : 'Save & Authorize'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white glass-card transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function AccountsClient({ accounts }: { accounts: any[] }) {
  const [expanded, setExpanded] = useState<Platform | null>(null)
  const [localAccounts, setLocalAccounts] = useState(accounts)

  const statusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {status}
      </span>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setLocalAccounts((p) => p.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
          <ShieldCheck size={13} className="text-purple-400" />
          OAuth2 & API Integrations
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Social Accounts
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Connect target social accounts to orchestrate automated episode publishing across all platforms.
        </p>
      </div>

      {/* Connected Accounts List */}
      {localAccounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Connected Accounts ({localAccounts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {localAccounts.map((acc) => {
              const matched = PLATFORMS.find((p) => p.id === acc.platform)
              const Icon = matched?.icon || Radio

              return (
                <div
                  key={acc.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/[0.08]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{acc.label}</div>
                      <div className="text-xs text-gray-400 capitalize">{acc.platform}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {statusBadge(acc.status)}
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Disconnect"
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

      {/* Add New Platforms */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Available Social Platforms
        </h2>
        <div className="space-y-3.5">
          {PLATFORMS.map((p) => {
            const Icon = p.icon
            const isOpen = expanded === p.id

            return (
              <div
                key={p.id}
                className={`glass-panel rounded-2xl p-5 border transition-all duration-300 ${
                  isOpen ? `${p.border} ${p.glow}` : 'border-white/[0.08] hover:border-purple-500/30'
                }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center border border-white/[0.1] shrink-0`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-base text-white flex items-center gap-2">
                        {p.label}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.badgeBg}`}>
                          {p.id.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="p-2 rounded-xl glass-card text-gray-400 hover:text-white transition-colors"
                    >
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <AccountForm
                    platform={p}
                    onSave={(newAcc) => {
                      setLocalAccounts((prev) => [...prev, newAcc])
                      setExpanded(null)
                    }}
                    onCancel={() => setExpanded(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
