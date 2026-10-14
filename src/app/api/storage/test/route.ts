import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createS3Client } from '@/lib/storage'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { provider, accountId, accessKey, secretKey, bucket, endpoint } = body

  try {
    const client = createS3Client({ provider, accountId, accessKey, secretKey, bucket, endpoint })
    await client.send(new ListBucketsCommand({}))
    return NextResponse.json({ ok: true, message: 'Connection successful!' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 400 })
  }
}
