import { prisma } from '@/lib/prisma'
import SeriesListClient from './SeriesListClient'

export const dynamic = 'force-dynamic'

export default async function SeriesPage() {
  const series = await prisma.series.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      episodes: { orderBy: { episodeNumber: 'asc' } },
      storageAccount: { select: { label: true, provider: true } },
    },
  })

  return <SeriesListClient initialSeries={series} />
}
