'use client'
import { useState, useEffect } from 'react'
import { Bell, Send, MessageSquare, CheckCircle2, AlertTriangle, HardDrive, Shield, Lock, KeyRound } from 'lucide-react'

export default function SettingsPage() {
  const [form, setForm] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    discordWebhook: '',
    onSuccess: true,
    onFailure: true,
    onStorageWarning: true,
    onTokenExpiry: true,
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState('')

  // Password change state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setForm((prev) => ({
            ...prev,
            telegramBotToken: data.telegramBotToken || '',
            telegramChatId: data.telegramChatId || '',
            discordWebhook: data.discordWebhook || '',
            onSuccess: data.onSuccess ?? true,
            onFailure: data.onFailure ?? true,
            onStorageWarning: data.onStorageWarning ?? true,
            onTokenExpiry: data.onTokenExpiry ?? true,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPw || !newPw) {
      setPwMsg('❌ Both fields are required.')
      return
    }
    setPwSaving(true)
    setPwMsg('')
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg('✅ Master password updated successfully!')
        setCurrentPw('')
        setNewPw('')
      } else {
        setPwMsg(`❌ ${data.error}`)
      }
    } catch (err: any) {
      setPwMsg(`❌ ${err.message}`)
    } finally {
      setPwSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setMsg(res.ok ? '✅ Settings saved!' : '❌ Save failed')
  }

  const handleTest = async () => {
    setTesting(true)
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '🔔 Test from DramaAuto!' }),
    })
    const data = await res.json()
    setTesting(false)
    setMsg(res.ok ? `✅ Sent via: ${data.sent?.join(', ') || 'none'}` : '❌ Test failed')
  }

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
          <Bell size={13} className="text-purple-400" />
          Realtime Dispatch Alerts
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Notifications & Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Receive instant push alerts to Telegram or Discord whenever episodes finish uploading or publishing.
        </p>
      </div>

      {/* Telegram Card */}
      <div className="glass-panel rounded-2xl p-6 border border-sky-500/20 shadow-sky-500/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Send size={18} />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Telegram Bot Dispatcher</h2>
            <p className="text-xs text-gray-400">Sends rich formatted message directly to your Telegram chat or channel</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">Telegram Bot Token</label>
            <input
              type="password"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
              value={form.telegramBotToken || ''}
              onChange={(e) => update('telegramBotToken', e.target.value)}
              placeholder="1234567890:ABCdefGHIjklMNOpqrs..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">Chat ID / Channel ID</label>
            <input
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
              value={form.telegramChatId || ''}
              onChange={(e) => update('telegramChatId', e.target.value)}
              placeholder="e.g. 1986277232 or -1001234567890"
            />
          </div>
        </div>
      </div>

      {/* Discord Card */}
      <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20 shadow-indigo-500/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Discord Webhook Channel</h2>
            <p className="text-xs text-gray-400">Posts real-time publish cards to your Discord server</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-300 block mb-1.5">Discord Webhook URL</label>
          <input
            type="password"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
            value={form.discordWebhook || ''}
            onChange={(e) => update('discordWebhook', e.target.value)}
            placeholder="https://discord.com/api/webhooks/123456789/..."
          />
        </div>
      </div>

      {/* Alert Event Toggles */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Trigger Events
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'onSuccess', label: 'Successful Publish (with video link)', icon: CheckCircle2, color: 'text-emerald-400' },
            { key: 'onFailure', label: 'Failed Publish (with error logs)', icon: AlertTriangle, color: 'text-rose-400' },
            { key: 'onStorageWarning', label: 'Storage Quota Alert (>80%)', icon: HardDrive, color: 'text-amber-400' },
            { key: 'onTokenExpiry', label: 'Social Token Expiry Warning', icon: Shield, color: 'text-purple-400' },
          ].map(({ key, label, icon: Icon, color }) => {
            const isChecked = !!form[key as keyof typeof form]
            return (
              <div
                key={key}
                onClick={() => update(key, !isChecked)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                  isChecked
                    ? 'bg-purple-600/15 border-purple-500/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]'
                    : 'glass-card border-white/[0.06] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className={color} />
                  <span className="text-xs font-medium text-gray-200">{label}</span>
                </div>
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold border ${
                  isChecked ? 'bg-purple-500 border-purple-400 text-white' : 'border-white/[0.2]'
                }`}>
                  {isChecked && '✓'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Password Management */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <KeyRound size={18} />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Master Password & Security</h2>
            <p className="text-xs text-gray-400">Control authentication protection for dashboard, API keys, and R2 storage</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Current Password</label>
              <input
                type="password"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current master password"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">New Master Password</label>
              <input
                type="password"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          {pwMsg && <p className="text-xs font-semibold text-purple-300">{pwMsg}</p>}

          <button
            type="submit"
            disabled={pwSaving}
            className="glass-card hover:bg-white/[0.08] disabled:opacity-50 text-purple-300 hover:text-white border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
          >
            {pwSaving ? 'Updating Password…' : 'Update Master Password'}
          </button>
        </form>
      </div>

      {msg && <p className="text-sm font-semibold text-purple-300">{msg}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="glass-card hover:bg-white/[0.08] disabled:opacity-50 text-gray-200 px-5 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          {testing ? 'Sending Dispatch…' : '🔔 Send Test Message'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
