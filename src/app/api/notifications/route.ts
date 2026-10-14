import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// GET /api/notifications - get settings
export async function GET() {
  let settings = await prisma.notificationSettings.findFirst()
  if (!settings) {
    settings = await prisma.notificationSettings.create({ data: {} })
  }
  return NextResponse.json(settings)
}

// POST /api/notifications - update settings
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    telegramBotToken,
    telegramChatId,
    discordWebhook,
    onSuccess,
    onFailure,
    onStorageWarning,
    onTokenExpiry,
  } = body

  const data = {
    telegramBotToken: telegramBotToken || null,
    telegramChatId: telegramChatId || null,
    discordWebhook: discordWebhook || null,
    onSuccess: onSuccess ?? true,
    onFailure: onFailure ?? true,
    onStorageWarning: onStorageWarning ?? true,
    onTokenExpiry: onTokenExpiry ?? true,
  }

  let settings = await prisma.notificationSettings.findFirst()

  if (settings) {
    settings = await prisma.notificationSettings.update({ where: { id: settings.id }, data })
  } else {
    settings = await prisma.notificationSettings.create({ data })
  }

  return NextResponse.json(settings)
}
