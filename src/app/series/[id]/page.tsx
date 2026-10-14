import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SeriesDetailClient from './SeriesDetailClient'

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  const series = await prisma.series.findUnique({
    where: { id: params.id },
    include: {
      episodes: { orderBy: { episodeNumber: 'asc' } },
      storageAccount: { select: { label: true, provider: true, bucket: true } },
    },
  })

  if (!series) return notFound()

  return <SeriesDetailClient initialSeries={series} />
}
