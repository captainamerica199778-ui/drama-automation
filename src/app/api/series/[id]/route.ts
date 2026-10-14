import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromStorage } from '@/lib/storage'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      episodes: { orderBy: { episodeNumber: 'asc' } },
      storageAccount: true,
    },
  })
  if (!series) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(series)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const series = await prisma.series.update({ where: { id }, data: body })
  return NextResponse.json(series)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const series = await prisma.series.findUnique({
    where: { id },
    include: { storageAccount: true, episodes: true },
  })

  if (series?.storageAccount) {
    const sa = series.storageAccount
    for (const ep of series.episodes) {
      if (ep.r2Key) {
        try {
          await deleteFromStorage(
            {
              provider: sa.provider as any,
              accessKey: sa.accessKey,
              secretKey: sa.secretKey,
              bucket: sa.bucket,
              endpoint: sa.endpoint || undefined,
              accountId: sa.accountId || undefined,
            },
            ep.r2Key
          )
        } catch (err) {
          console.error(`Failed to delete ep ${ep.episodeNumber} from storage:`, err)
        }
      }
    }
  }

  await prisma.series.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
