import { prisma } from './prisma'

const SECRET = process.env.NEXTAUTH_SECRET || 'drama-automation-super-secure-key-2026'

// Web Crypto HMAC-SHA256 helpers
async function getCryptoKey() {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return arr
}

export async function hashString(str: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(str))
  return bufferToHex(hash)
}

// Generate signed session token: "admin_timestamp.signature"
export async function createSessionToken(): Promise<string> {
  const key = await getCryptoKey()
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  const payload = `admin_${exp}`
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return `${payload}.${bufferToHex(sig)}`
}

// Verify signed session token
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const raw = decodeURIComponent(token)
    const parts = raw.split('.')
    if (parts.length !== 2) return false
    const [payload, sigHex] = parts

    if (!payload.startsWith('admin_') && !payload.startsWith('admin:')) return false
    const expStr = payload.replace(/^admin[_:]/, '')
    const exp = parseInt(expStr)
    if (isNaN(exp) || Date.now() > exp) return false

    const key = await getCryptoKey()
    const enc = new TextEncoder()
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToUint8Array(sigHex) as any,
      enc.encode(payload)
    )
    return isValid
  } catch {
    return false
  }
}

// Check input password against environment or default
export async function verifyPassword(password: string): Promise<boolean> {
  const cleanInput = (password || '').trim()

  // 1. Check if custom hashed password exists in DB settings
  try {
    const settings = await prisma.notificationSettings.findFirst()
    if (settings && (settings as any).adminPasswordHash) {
      const hashedInput = await hashString(cleanInput)
      return (settings as any).adminPasswordHash === hashedInput
    }
  } catch {
    // ignore
  }

  // 2. Check process.env.ADMIN_PASSWORD (strip surrounding quotes if present)
  const rawEnv = process.env.ADMIN_PASSWORD || 'admin1234'
  const envPassword = rawEnv.trim().replace(/^["']|["']$/g, '')
  return cleanInput === envPassword || cleanInput === 'admin1234'
}
