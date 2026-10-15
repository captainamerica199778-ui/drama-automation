import { S3Client, DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface StorageConfig {
  provider: 'r2' | 'b2' | 'minio'
  accessKey: string
  secretKey: string
  bucket: string
  endpoint?: string
  accountId?: string
  publicUrl?: string
}

export function createS3Client(config: StorageConfig) {
  let endpoint: string

  if (config.provider === 'r2') {
    endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`
  } else if (config.provider === 'b2') {
    endpoint = config.endpoint || 'https://s3.us-west-004.backblazeb2.com'
  } else {
    endpoint = config.endpoint || 'http://localhost:9000'
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: config.provider === 'minio',
  })
}

export async function createPresignedUploadUrl(
  config: StorageConfig,
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = createS3Client(config)
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export async function ensureBucketCors(config: StorageConfig): Promise<boolean> {
  try {
    const client = createS3Client(config)
    await client.send(
      new PutBucketCorsCommand({
        Bucket: config.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    )
    return true
  } catch (err) {
    console.warn('[storage] Notice: PutBucketCors not permitted on token or failed:', err)
    return false
  }
}

export async function uploadFileToStorage(
  config: StorageConfig,
  key: string,
  body: Buffer | ReadableStream,
  contentType: string,
  onProgress?: (pct: number) => void
) {
  const client = createS3Client(config)
  const upload = new Upload({
    client,
    params: { Bucket: config.bucket, Key: key, Body: body, ContentType: contentType },
    queueSize: 4,
    partSize: 1024 * 1024 * 10, // 10MB parts
  })

  upload.on('httpUploadProgress', (p) => {
    if (onProgress && p.total) onProgress(Math.round((p.loaded! / p.total) * 100))
  })

  return upload.done()
}

export async function deleteFromStorage(config: StorageConfig, key: string) {
  const client = createS3Client(config)
  return client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
}

export async function listStorageFiles(config: StorageConfig, prefix?: string) {
  const client = createS3Client(config)
  const resp = await client.send(
    new ListObjectsV2Command({ Bucket: config.bucket, Prefix: prefix })
  )
  return resp.Contents || []
}

export function getPublicUrl(config: StorageConfig, key: string): string {
  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/$/, '')}/${key}`
  }
  if (config.provider === 'r2') {
    if (config.endpoint && !config.endpoint.includes('cloudflarestorage.com')) {
      return `${config.endpoint.replace(/\/$/, '')}/${key}`
    }
    return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`
  }
  if (config.provider === 'b2') {
    const base = (config.endpoint || 'https://s3.us-west-004.backblazeb2.com').replace(/\/$/, '')
    return `${base}/${config.bucket}/${key}`
  }
  const base = (config.endpoint || 'http://localhost:9000').replace(/\/$/, '')
  return `${base}/${config.bucket}/${key}`
}
