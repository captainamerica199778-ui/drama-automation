import { NextResponse } from 'next/server'
import { processDueScheduledJobs } from '@/lib/queue'

export async function POST() {
  const results = await processDueScheduledJobs()
  return NextResponse.json({ processed: results.length, results })
}

export async function GET() {
  const results = await processDueScheduledJobs()
  return NextResponse.json({ processed: results.length, results })
}
