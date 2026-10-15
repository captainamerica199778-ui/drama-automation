import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const storage = await prisma.storageAccount.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(storage)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { provider, label, accountId, accessKey, secretKey, bucket, endpoint, publicUrl } = body

    if (!provider || !label || !accessKey || !secretKey || !bucket) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const account = await prisma.storageAccount.create({
      data: { provider, label, accountId, accessKey, secretKey, bucket, endpoint, publicUrl, status: 'active' },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database write error' }, { status: 500 })
  }
}
