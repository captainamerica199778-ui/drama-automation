import { publishToYouTube } from './youtube'
import { publishToInstagram } from './instagram'
import { publishToFacebook } from './facebook'
import { publishToTikTok } from './tiktok'
import { publishToRumble } from './rumble'
import { PublishResult } from './youtube'

export async function publishToPlatform(options: {
  platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'rumble'
  credentials: Record<string, any>
  videoUrl: string
  title: string
  description?: string
  tags?: string[]
  thumbnailUrl?: string
}): Promise<PublishResult> {
  const { platform, credentials, videoUrl, title, description, tags, thumbnailUrl } = options

  switch (platform) {
    case 'youtube':
      return publishToYouTube({
        videoUrl,
        title,
        description,
        tags,
        thumbnailUrl,
        accessToken: credentials.accessToken || credentials.clientSecret,
      })
    case 'instagram':
      return publishToInstagram({
        videoUrl,
        caption: `${title}\n\n${description || ''}\n\n${tags?.map((t) => `#${t}`).join(' ') || ''}`,
        accountId: credentials.accountId,
        accessToken: credentials.accessToken,
      })
    case 'facebook':
      return publishToFacebook({
        videoUrl,
        title,
        description,
        pageId: credentials.pageId,
        accessToken: credentials.accessToken,
      })
    case 'tiktok':
      return publishToTikTok({
        videoUrl,
        title,
        accessToken: credentials.accessToken,
      })
    case 'rumble':
      return publishToRumble({
        videoUrl,
        title,
        channelId: credentials.channelId,
        apiKey: credentials.apiKey,
      })
    default:
      return { success: false, error: `Unsupported platform: ${platform}` }
  }
}

export type { PublishResult }
