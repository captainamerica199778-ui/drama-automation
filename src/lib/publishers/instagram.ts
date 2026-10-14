import axios from 'axios'
import { PublishResult } from './youtube'

export async function publishToInstagram(options: {
  videoUrl: string
  caption: string
  accountId: string
  accessToken: string
}): Promise<PublishResult> {
  try {
    // 1. Create Media Container for REELS
    const containerRes = await axios.post(
      `https://graph.facebook.com/v19.0/${options.accountId}/media`,
      {
        media_type: 'REELS',
        video_url: options.videoUrl,
        caption: options.caption,
        access_token: options.accessToken,
      }
    )

    const creationId = containerRes.data?.id
    if (!creationId) {
      return { success: false, error: 'Failed to create Instagram media container' }
    }

    // 2. Poll container status until FINISHED (up to 60s)
    let status = 'IN_PROGRESS'
    let attempts = 0
    while (status !== 'FINISHED' && status !== 'ERROR' && attempts < 12) {
      await new Promise((r) => setTimeout(r, 5000))
      attempts++
      const checkRes = await axios.get(`https://graph.facebook.com/v19.0/${creationId}`, {
        params: { fields: 'status_code', access_token: options.accessToken },
      })
      status = checkRes.data?.status_code
    }

    if (status !== 'FINISHED') {
      return { success: false, error: `Media processing failed or timed out with status: ${status}` }
    }

    // 3. Publish Media Container
    const publishRes = await axios.post(
      `https://graph.facebook.com/v19.0/${options.accountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: options.accessToken,
      }
    )

    const mediaId = publishRes.data?.id
    return {
      success: true,
      postId: mediaId,
      postUrl: mediaId ? `https://www.instagram.com/p/${mediaId}` : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error?.message || error.message || 'Instagram publishing failed',
    }
  }
}
