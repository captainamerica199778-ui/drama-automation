import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.NEXTAUTH_SECRET || 'drama-automation-super-secure-key-2026'

function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return arr
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const raw = decodeURIComponent(token)
    const parts = raw.split('.')
    if (parts.length !== 2) return false
    const [payload, sigHex] = parts

    if (!payload.startsWith('admin_') && !payload.startsWith('admin:')) return false
    const expStr = payload.replace(/^admin[_:]/, '')
    const exp = parseInt(expStr)
    if (isNaN(exp) || Date.now() > exp) return false

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToUint8Array(sigHex) as any,
      enc.encode(payload)
    )
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Allow public static assets and auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // 2. Check auth_session cookie
  const sessionCookie = req.cookies.get('auth_session')?.value
  const isAuthenticated = sessionCookie ? await verifyToken(sessionCookie) : false

  const host = req.headers.get('host') || req.nextUrl.host || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol ? req.nextUrl.protocol.replace(':', '') : 'http')

  // If already authenticated and visiting /login -> redirect to dashboard
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(`${proto}://${host}/`)
    }
    return NextResponse.next()
  }

  if (isAuthenticated) {
    return NextResponse.next()
  }

  // 3. Not authenticated
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 })
  }

  // Redirect to login page preserving exact incoming host and IP
  const fromQuery = pathname !== '/' ? `?from=${encodeURIComponent(pathname)}` : ''
  return NextResponse.redirect(`${proto}://${host}/login${fromQuery}`)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
