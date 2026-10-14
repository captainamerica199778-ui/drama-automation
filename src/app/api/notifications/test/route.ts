import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  const settings = await prisma.notificationSettings.findFirst()
  if (!settings) return NextResponse.json({ error: 'No notification settings' }, { status: 400 })

  const results = await sendNotification(settings, message || '🔔 Test notification from DramaAuto!')
  return NextResponse.json({ sent: results })
}
