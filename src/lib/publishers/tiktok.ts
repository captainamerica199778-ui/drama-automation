import axios from 'axios'
import { PublishResult } from './youtube'

export async function publishToTikTok(options: {
  videoUrl: string
  title: string
  accessToken: string
}): Promise<PublishResult> {
  try {
    // 1. Initialize video upload via TikTok Content Posting API
    const initRes = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        post_info: {
          title: options.title,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: options.videoUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    )

    const publishId = initRes.data?.data?.publish_id
    return {
      success: true,
      postId: publishId,
      postUrl: publishId ? `https://www.tiktok.com` : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error?.message || error.message || 'TikTok publishing failed',
    }
  }
}
