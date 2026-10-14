import { prisma } from '@/lib/prisma'
import AccountsClient from './AccountsClient'

export default async function AccountsPage() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: 'desc' } })
  return <AccountsClient accounts={accounts} />
}
