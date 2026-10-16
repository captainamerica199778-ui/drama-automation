import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/schedule - Create scheduled jobs for episodes
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { episodeIds, socialAccountIds, startAt, intervalHours, intervalMinutes } = body

  if (!episodeIds?.length || !socialAccountIds?.length || !startAt) {
    return NextResponse.json({ error: 'episodeIds, socialAccountIds, and startAt are required' }, { status: 400 })
  }

  // Calculate interval in milliseconds (supports minutes or hours)
  let intervalMs = 0
  if (intervalMinutes !== undefined && intervalMinutes !== null && Number(intervalMinutes) > 0) {
    intervalMs = Number(intervalMinutes) * 60 * 1000
  } else if (intervalHours !== undefined && intervalHours !== null && Number(intervalHours) > 0) {
    intervalMs = Number(intervalHours) * 60 * 60 * 1000
  }

  const jobs = []
  let current = new Date(startAt)

  for (let i = 0; i < episodeIds.length; i++) {
    const episodeId = episodeIds[i]
    if (i > 0 && intervalMs > 0) {
      current = new Date(current.getTime() + intervalMs)
    }

    for (const socialAccountId of socialAccountIds) {
      const job = await prisma.scheduledJob.create({
        data: { episodeId, socialAccountId, scheduledAt: new Date(current), status: 'pending' },
      })
      jobs.push(job)
    }

    await prisma.episode.update({ where: { id: episodeId }, data: { status: 'scheduled' } })
  }

  return NextResponse.json({ jobs }, { status: 201 })
}

export async function GET() {
  const jobs = await prisma.scheduledJob.findMany({
    orderBy: { scheduledAt: 'asc' },
    include: {
      episode: { include: { series: true } },
      socialAccount: { select: { label: true, platform: true } },
    },
  })
  return NextResponse.json(jobs)
}
