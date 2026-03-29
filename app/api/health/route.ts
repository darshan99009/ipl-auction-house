import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status:  'ok',
    service: 'ipl-auction-house',
    time:    new Date().toISOString(),
  })
}
