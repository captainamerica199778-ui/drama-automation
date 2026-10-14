import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { platform, label, accessToken, refreshToken, ...extra } = body

  if (!platform || !label) {
    return NextResponse.json({ error: 'platform and label are required' }, { status: 400 })
  }

  const account = await prisma.socialAccount.create({
    data: {
      platform,
      label,
      accessToken: accessToken || '',
      refreshToken: refreshToken || null,
      extra: JSON.stringify(extra),
      status: 'active',
    },
  })

  return NextResponse.json(account, { status: 201 })
}
