import axios from 'axios'
import { PublishResult } from './youtube'

export async function publishToFacebook(options: {
  videoUrl: string
  title: string
  description?: string
  pageId: string
  accessToken: string
}): Promise<PublishResult> {
  try {
    // Publish video or reel to Facebook Page
    const res = await axios.post(`https://graph.facebook.com/v19.0/${options.pageId}/videos`, {
      file_url: options.videoUrl,
      title: options.title,
      description: options.description || options.title,
      access_token: options.accessToken,
    })

    const videoId = res.data?.id
    return {
      success: true,
      postId: videoId,
      postUrl: videoId ? `https://www.facebook.com/${options.pageId}/videos/${videoId}` : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error?.message || error.message || 'Facebook publishing failed',
    }
  }
}
