import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const series = await prisma.series.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { episodes: true, storageAccount: { select: { label: true, provider: true } } },
  })
  return NextResponse.json(series)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, tags, genre, coverUrl, storageAccountId } = body

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const series = await prisma.series.create({
    data: { title, description, tags, genre, coverUrl, storageAccountId },
  })
  return NextResponse.json(series, { status: 201 })
}
