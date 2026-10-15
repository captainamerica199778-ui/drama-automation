import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPresignedUploadUrl, getPublicUrl, ensureBucketCors } from '@/lib/storage'

// POST /api/upload/presign
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { seriesId, fileName, contentType } = body

    if (!seriesId || !fileName) {
      return NextResponse.json({ error: 'seriesId and fileName are required' }, { status: 400 })
    }

    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      include: { storageAccount: true },
    })

    if (!series || !series.storageAccount) {
      return NextResponse.json({ error: 'Series or associated storage account not found' }, { status: 404 })
    }

    const sa = series.storageAccount
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `series/${seriesId}/${Date.now()}_${sanitizedFileName}`
    const mimeType = contentType || 'video/mp4'

    const storageConfig = {
      provider: sa.provider as any,
      accessKey: sa.accessKey,
      secretKey: sa.secretKey,
      bucket: sa.bucket,
      endpoint: sa.endpoint || undefined,
      accountId: sa.accountId || undefined,
      publicUrl: sa.publicUrl || undefined,
    }

    // Attempt to ensure CORS is enabled on the bucket
    ensureBucketCors(storageConfig).catch(() => {})

    const uploadUrl = await createPresignedUploadUrl(storageConfig, key, mimeType, 3600)
    const publicUrl = getPublicUrl(storageConfig, key)

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      bucket: sa.bucket,
    })
  } catch (err: any) {
    console.error('[presign error]', err)
    return NextResponse.json({ error: err.message || 'Failed to generate presigned URL' }, { status: 500 })
  }
}
