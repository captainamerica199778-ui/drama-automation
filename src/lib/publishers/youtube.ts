import axios from 'axios'

export interface PublishResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

export async function publishToYouTube(options: {
  videoUrl: string
  title: string
  description?: string
  tags?: string[]
  thumbnailUrl?: string
  accessToken: string
}): Promise<PublishResult> {
  try {
    // 1. Download video stream/buffer from videoUrl
    const videoStream = await axios.get(options.videoUrl, { responseType: 'arraybuffer' })

    // 2. Upload video metadata + media to YouTube Data API v3
    const uploadRes = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      videoStream.data,
      {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          'Content-Type': 'video/mp4',
        },
        params: {
          part: 'snippet,status',
        },
      }
    )

    const videoId = uploadRes.data?.id

    // 3. Set custom thumbnail if available
    if (videoId && options.thumbnailUrl) {
      try {
        const thumbStream = await axios.get(options.thumbnailUrl, { responseType: 'arraybuffer' })
        await axios.post(
          `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
          thumbStream.data,
          {
            headers: {
              Authorization: `Bearer ${options.accessToken}`,
              'Content-Type': 'image/jpeg',
            },
          }
        )
      } catch (thumbErr) {
        console.warn('YouTube thumbnail set warning:', thumbErr)
      }
    }

    return {
      success: true,
      postId: videoId,
      postUrl: videoId ? `https://youtube.com/watch?v=${videoId}` : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error?.message || error.message || 'YouTube publishing failed',
    }
  }
}
