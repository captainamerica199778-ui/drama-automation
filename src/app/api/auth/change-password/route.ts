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

    // Update .env file with new ADMIN_PASSWORD
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8')
      if (envContent.includes('ADMIN_PASSWORD=')) {
        envContent = envContent.replace(/ADMIN_PASSWORD="?[^"\n\r]*"?/, `ADMIN_PASSWORD="${newPassword}"`)
      } else {
        envContent += `\nADMIN_PASSWORD="${newPassword}"\n`
      }
      fs.writeFileSync(envPath, envContent, 'utf8')
    }

    return NextResponse.json({ ok: true, message: 'Master password updated successfully!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
