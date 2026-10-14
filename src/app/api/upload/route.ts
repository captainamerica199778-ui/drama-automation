import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFileToStorage, getPublicUrl } from '@/lib/storage'

export const config = { api: { bodyParser: false } }

// POST /api/upload - Upload episode video to storage
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const seriesId = formData.get('seriesId') as string
  const episodeNumber = parseInt(formData.get('episodeNumber') as string)
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const tags = formData.get('tags') as string | null
  const thumbnailFile = formData.get('thumbnail') as File | null

  if (!file || !seriesId) {
    return NextResponse.json({ error: 'file and seriesId are required' }, { status: 400 })
  }

  // Get series + storage config
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: { storageAccount: true },
  })

  if (!series || !series.storageAccount) {
    return NextResponse.json({ error: 'Series or storage account not found' }, { status: 404 })
  }

  const sa = series.storageAccount
  const key = `series/${seriesId}/ep${episodeNumber}_${Date.now()}_${file.name}`

  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFileToStorage(
    {
      provider: sa.provider as any,
      accessKey: sa.accessKey,
      secretKey: sa.secretKey,
      bucket: sa.bucket,
      endpoint: sa.endpoint || undefined,
      accountId: sa.accountId || undefined,
    },
    key,
    buffer,
    file.type || 'video/mp4'
  )

  const publicUrl = sa.publicUrl ? `${sa.publicUrl}/${key}` : getPublicUrl(
    { provider: sa.provider as any, accessKey: sa.accessKey, secretKey: sa.secretKey, bucket: sa.bucket, endpoint: sa.endpoint || undefined, accountId: sa.accountId || undefined },
    key
  )

  // Upload thumbnail if provided
  let thumbnailUrl: string | undefined = undefined
  if (thumbnailFile) {
    const thumbKey = `series/${seriesId}/thumb_ep${episodeNumber}_${Date.now()}_${thumbnailFile.name}`
    const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer())
    await uploadFileToStorage(
      {
        provider: sa.provider as any,
        accessKey: sa.accessKey,
        secretKey: sa.secretKey,
        bucket: sa.bucket,
        endpoint: sa.endpoint || undefined,
        accountId: sa.accountId || undefined,
      },
      thumbKey,
      thumbBuffer,
      thumbnailFile.type || 'image/jpeg'
    )
    thumbnailUrl = sa.publicUrl ? `${sa.publicUrl}/${thumbKey}` : getPublicUrl(
      { provider: sa.provider as any, accessKey: sa.accessKey, secretKey: sa.secretKey, bucket: sa.bucket, endpoint: sa.endpoint || undefined, accountId: sa.accountId || undefined },
      thumbKey
    )
  }

  // Create or update episode record
  const episode = await prisma.episode.upsert({
    where: { seriesId_episodeNumber: { seriesId, episodeNumber } },
    create: {
      seriesId,
      episodeNumber,
      title: title || `Episode ${episodeNumber}`,
      description: description || undefined,
      tags: tags || undefined,
      thumbnailUrl,
      r2Key: key,
      r2Url: publicUrl,
      fileSize: buffer.length,
      status: 'ready',
    },
    update: {
      title: title || undefined,
      description: description || undefined,
      tags: tags || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      r2Key: key,
      r2Url: publicUrl,
      fileSize: buffer.length,
      status: 'ready',
    },
  })

  return NextResponse.json(episode, { status: 201 })
}
