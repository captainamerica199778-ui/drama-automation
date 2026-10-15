import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, hashString } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    const isMatch = await verifyPassword(currentPassword)
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const cleanNewPw = newPassword.trim()
    const passwordHash = await hashString(cleanNewPw)

    // 1. Persist hashed password in Database
    let settings = await prisma.notificationSettings.findFirst()
    if (settings) {
      await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: { adminPasswordHash: passwordHash },
      })
    } else {
      await prisma.notificationSettings.create({
        data: { adminPasswordHash: passwordHash },
      })
    }

    // 2. Update active memory process.env
    process.env.ADMIN_PASSWORD = cleanNewPw

    // 3. Update local .env file if present
    try {
      const envPath = path.join(process.cwd(), '.env')
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8')
        if (envContent.includes('ADMIN_PASSWORD=')) {
          envContent = envContent.replace(/ADMIN_PASSWORD="?[^"\n\r]*"?/, `ADMIN_PASSWORD="${cleanNewPw}"`)
        } else {
          envContent += `\nADMIN_PASSWORD="${cleanNewPw}"\n`
        }
        fs.writeFileSync(envPath, envContent, 'utf8')
      }
    } catch {
      // Ignore if filesystem is read-only (e.g. Vercel)
    }

    return NextResponse.json({ ok: true, message: 'Master password updated successfully!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
