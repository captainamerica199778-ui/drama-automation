import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const storage = await prisma.storageAccount.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(storage)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { provider, label, accountId, accessKey, secretKey, bucket, endpoint, publicUrl } = body

  if (!provider || !label || !accessKey || !secretKey || !bucket) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const account = await prisma.storageAccount.create({
    data: { provider, label, accountId, accessKey, secretKey, bucket, endpoint, publicUrl, status: 'active' },
  })

  return NextResponse.json(account, { status: 201 })
}
