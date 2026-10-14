import { prisma } from './prisma'
import { publishToPlatform } from './publishers'
import { sendNotification } from './notifications'
import { deleteFromStorage } from './storage'

export async function processDueScheduledJobs() {
  const now = new Date()

  // Find pending jobs whose scheduledAt <= now
  const dueJobs = await prisma.scheduledJob.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: now },
    },
    include: {
      episode: {
        include: {
          series: {
            include: { storageAccount: true },
          },
        },
      },
      socialAccount: true,
    },
    take: 5,
  })

  const results = []

  for (const job of dueJobs) {
    // 1. Mark processing
    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: { status: 'processing' },
    })

    const ep = job.episode
    const series = ep.series
    const social = job.socialAccount

    let credentials: Record<string, any> = {}
    try {
      credentials = JSON.parse(social.credentials)
    } catch {
      credentials = {}
    }

    const videoUrl = ep.r2Url

    if (!videoUrl) {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMessage: 'No storage URL found for this episode' },
      })
      continue
    }

    const pubRes = await publishToPlatform({
      platform: social.platform as any,
      credentials,
      videoUrl,
      title: `${series.title} - ${ep.title || `Episode ${ep.episodeNumber}`}`,
      description: ep.description || series.description || undefined,
      tags: ep.tags ? ep.tags.split(',').map((t: string) => t.trim()) : series.tags ? series.tags.split(',').map((t: string) => t.trim()) : undefined,
      thumbnailUrl: ep.thumbnailUrl || series.coverUrl || undefined,
    })

    const status = pubRes.success ? 'published' : 'failed'

    // Update job status
    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: {
        status,
        errorMessage: pubRes.error,
        publishLogs: {
          create: {
            platform: social.platform,
            status,
            postUrl: pubRes.postUrl,
            errorMsg: pubRes.error,
          },
        },
      },
    })

    // Update episode status
    if (pubRes.success) {
      await prisma.episode.update({
        where: { id: ep.id },
        data: { status: 'published' },
      })
    }

    // Send notifications if configured
    const notifSettings = await prisma.notificationSettings.findFirst()
    if (notifSettings) {
      const msg = pubRes.success
        ? `🎬 <b>Published Episode!</b>\nSeries: <b>${series.title}</b>\nEpisode: <b>${ep.episodeNumber}</b>\nPlatform: <b>${social.platform.toUpperCase()}</b>\n${pubRes.postUrl ? `🔗 Link: ${pubRes.postUrl}` : ''}`
        : `⚠️ <b>Publishing Failed!</b>\nSeries: <b>${series.title}</b>\nEpisode: <b>${ep.episodeNumber}</b>\nPlatform: <b>${social.platform.toUpperCase()}</b>\nError: <code>${pubRes.error}</code>`

      if ((pubRes.success && notifSettings.onSuccess) || (!pubRes.success && notifSettings.onFailure)) {
        await sendNotification(notifSettings, msg)
      }
    }

    // Auto-cleanup from R2 if configured and published
    if (pubRes.success && ep.r2Key && series.storageAccount) {
      // Check if all jobs for this episode are published
      const remainingJobs = await prisma.scheduledJob.count({
        where: { episodeId: ep.id, status: { not: 'published' } },
      })
      if (remainingJobs === 0) {
        try {
          await deleteFromStorage(
            {
              provider: series.storageAccount.provider as any,
              accessKey: series.storageAccount.accessKey,
              secretKey: series.storageAccount.secretKey,
              bucket: series.storageAccount.bucket,
              endpoint: series.storageAccount.endpoint || undefined,
              accountId: series.storageAccount.accountId || undefined,
            },
            ep.r2Key
          )
        } catch (delErr) {
          console.error('Failed auto-delete from storage:', delErr)
        }
      }
    }

    results.push({ jobId: job.id, status, error: pubRes.error, postUrl: pubRes.postUrl })
  }

  return results
}
