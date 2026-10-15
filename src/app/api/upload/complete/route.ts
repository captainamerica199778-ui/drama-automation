import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/upload/complete
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      seriesId,
      episodeNumber,
      title,
      description,
      tags,
      thumbnailUrl,
      r2Key,
      r2Url,
      fileSize,
    } = body

    if (!seriesId || episodeNumber === undefined || !r2Key) {
      return NextResponse.json({ error: 'seriesId, episodeNumber, and r2Key are required' }, { status: 400 })
    }

    const episode = await prisma.episode.upsert({
      where: {
        seriesId_episodeNumber: {
          seriesId,
          episodeNumber: Number(episodeNumber),
        },
      },
      create: {
        seriesId,
        episodeNumber: Number(episodeNumber),
        title: title || `Episode ${episodeNumber}`,
        description: description || undefined,
        tags: tags || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        r2Key,
        r2Url,
        fileSize: fileSize ? Number(fileSize) : undefined,
        status: 'ready',
      },
      update: {
        title: title || undefined,
        description: description || undefined,
        tags: tags || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        r2Key,
        r2Url,
        fileSize: fileSize ? Number(fileSize) : undefined,
        status: 'ready',
      },
    })

    return NextResponse.json(episode, { status: 201 })
  } catch (err: any) {
    console.error('[upload complete error]', err)
    return NextResponse.json({ error: err.message || 'Failed to save episode' }, { status: 500 })
  }
}
