import { prisma } from '@/lib/prisma'
import AccountsClient from './AccountsClient'

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: 'desc' } })
  return <AccountsClient accounts={accounts} />
}
