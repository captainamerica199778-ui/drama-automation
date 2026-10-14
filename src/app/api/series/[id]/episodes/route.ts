import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromStorage } from '@/lib/storage'

// DELETE /api/series/[id]/episodes - Delete all episodes or a batch of selected episodes
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let episodeIds: string[] | undefined

  try {
    const body = await req.json()
    episodeIds = body?.episodeIds
  } catch {
    // Body is optional; if omitted, delete ALL episodes in this series
  }

  const series = await prisma.series.findUnique({
    where: { id: params.id },
    include: {
      storageAccount: true,
      episodes: episodeIds?.length ? { where: { id: { in: episodeIds } } } : true,
    },
  })

  if (!series) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 })
  }

  const sa = series.storageAccount

  // 1. Delete each episode from Cloudflare R2 / S3 storage
  if (sa) {
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

  // 2. Delete from database
  if (episodeIds?.length) {
    await prisma.episode.deleteMany({
      where: {
        id: { in: episodeIds },
        seriesId: params.id,
      },
    })
  } else {
    await prisma.episode.deleteMany({
      where: { seriesId: params.id },
    })
  }

  return NextResponse.json({
    ok: true,
    deletedCount: series.episodes.length,
  })
}
