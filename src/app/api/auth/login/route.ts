import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    let password = ''
    let isFormPost = false
    let from = '/'

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await req.json()
      password = body?.password || ''
      from = body?.from || '/'
    } else {
      isFormPost = true
      const formData = await req.formData()
      password = (formData.get('password') as string) || ''
      from = (formData.get('from') as string) || '/'
    }

    if (!password) {
      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=empty', req.url))
      }
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const isValid = await verifyPassword(password)
    if (!isValid) {
      // Artificial delay to prevent brute-force attacks
      await new Promise((r) => setTimeout(r, 600))
      if (isFormPost) {
        return NextResponse.redirect(new URL('/login?error=invalid', req.url))
      }
      return NextResponse.json({ error: 'Incorrect master password' }, { status: 401 })
    }

    const token = await createSessionToken()
    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'

    const host = req.headers.get('host') || req.nextUrl.host || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol ? req.nextUrl.protocol.replace(':', '') : 'http')
    const redirectUrl = `${proto}://${host}${from.startsWith('/') ? from : '/' + from}`

    const res = isFormPost
      ? NextResponse.redirect(redirectUrl, { status: 303 })
      : NextResponse.json({ ok: true })

    // Set secure HTTP-only cookie for 30 days
    res.cookies.set({
      name: 'auth_session',
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
