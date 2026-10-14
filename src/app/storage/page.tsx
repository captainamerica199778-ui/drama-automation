import { prisma } from '@/lib/prisma'
import StorageClient from './StorageClient'

export default async function StoragePage() {
  const accounts = await prisma.storageAccount.findMany({ orderBy: { createdAt: 'desc' } })
  return <StorageClient accounts={accounts} />
}
