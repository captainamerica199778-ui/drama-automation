import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromStorage } from '@/lib/storage'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const episode = await prisma.episode.findUnique({
    where: { id },
    include: {
      series: {
        include: { storageAccount: true },
      },
    },
  })

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
  }

  // Delete video file from R2 / S3 storage if configured
  const sa = episode.series.storageAccount
  if (sa && episode.r2Key) {
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
        episode.r2Key
      )
    } catch (err) {
      console.error('Failed to delete episode from storage:', err)
    }
  }

  // Delete from database
  await prisma.episode.delete({ where: { id } })

  return NextResponse.json({ ok: true, deletedId: id })
}
