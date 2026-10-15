import { NextRequest, NextResponse } from 'next/server'
import { createS3Client } from '@/lib/storage'
import { HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { provider, accountId, accessKey, secretKey, bucket, endpoint } = body

  if (!bucket) {
    return NextResponse.json({ ok: false, message: 'Bucket name is required' }, { status: 400 })
  }

  try {
    const client = createS3Client({ provider, accountId, accessKey, secretKey, bucket, endpoint })
    // Test access to the specific bucket instead of listing all account buckets
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch {
      // Fallback: list up to 1 object to test read access
      await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))
    }
    return NextResponse.json({ ok: true, message: 'Connection successful!' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message || 'Connection failed' }, { status: 400 })
  }
}
