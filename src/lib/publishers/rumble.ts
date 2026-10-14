import axios from 'axios'
import { PublishResult } from './youtube'

export async function publishToRumble(options: {
  videoUrl: string
  title: string
  channelId?: string
  apiKey: string
}): Promise<PublishResult> {
  try {
    const res = await axios.post(
      'https://rumble.com/api/v0/media.upload',
      {
        url: options.videoUrl,
        title: options.title,
        channel_id: options.channelId,
      },
      {
        headers: {
          'X-Api-Key': options.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    const mediaId = res.data?.media_id || res.data?.id
    return {
      success: true,
      postId: mediaId,
      postUrl: res.data?.url || (mediaId ? `https://rumble.com/v${mediaId}.html` : undefined),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error || error.message || 'Rumble publishing failed',
    }
  }
}
