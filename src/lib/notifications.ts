export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  })
  return resp.json()
}

export async function sendDiscordNotification(webhookUrl: string, message: string) {
  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  })
  return resp.status === 204
}

export async function sendNotification(
  settings: {
    telegramBotToken?: string | null
    telegramChatId?: string | null
    discordWebhook?: string | null
  },
  message: string
) {
  const results: string[] = []
  if (settings.telegramBotToken && settings.telegramChatId) {
    await sendTelegramNotification(settings.telegramBotToken, settings.telegramChatId, message)
    results.push('telegram')
  }
  if (settings.discordWebhook) {
    await sendDiscordNotification(settings.discordWebhook, message)
    results.push('discord')
  }
  return results
}
