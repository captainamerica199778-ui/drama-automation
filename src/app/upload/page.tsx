import { prisma } from '@/lib/prisma'
import UploadClient from './UploadClient'

export default async function UploadPage() {
  const [series, storageAccounts, socialAccounts] = await Promise.all([
    prisma.series.findMany({ orderBy: { title: 'asc' } }),
    prisma.storageAccount.findMany({ where: { status: 'active' } }),
    prisma.socialAccount.findMany({ where: { status: 'active' } }),
  ])
  return <UploadClient series={series} storageAccounts={storageAccounts} socialAccounts={socialAccounts} />
}
