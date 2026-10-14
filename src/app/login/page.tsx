'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'
  const urlError = searchParams.get('error')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    urlError === 'invalid'
      ? 'Incorrect master password.'
      : urlError === 'empty'
      ? 'Please enter your master password.'
      : ''
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Please enter your master password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, from }),
      })

      const data = await res.json()

      if (res.ok) {
        window.location.href = from
      } else {
        setError(data.error || 'Access denied.')
      }
    } catch (err: any) {
      setError(err.message || 'Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/[0.1] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-gradient-to-tr from-pink-600/20 to-purple-600/5 blur-3xl" />

        <div className="relative z-10 text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-400 p-0.5 mx-auto mb-4 shadow-xl shadow-purple-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0f1a] rounded-[14px] flex items-center justify-center">
              <Lock className="text-purple-400" size={24} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
            <ShieldCheck size={13} className="text-purple-400" />
            Protected Control Center
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            DramaAuto Security
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Enter your master password to access social media publishing, API tokens, and cloud storage.
          </p>
        </div>

        <form
          action="/api/auth/login"
          method="POST"
          onSubmit={handleLogin}
          className="space-y-4 relative z-10"
        >
          <input type="hidden" name="from" value={from} />

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Master Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                autoFocus
                className="w-full glass-input rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none placeholder:text-gray-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowPassword((prev) => !prev)
                }}
                className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer z-30"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="relative z-10 mt-6 pt-5 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-gray-500">
            End-to-end encrypted session with 30-day persistence.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#08090e]">
      {/* Background ambient lighting */}
      <div className="ambient-glow">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />
        <div className="glow-orb-3" />
      </div>

      <div className="relative z-10 w-full py-12">
        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
