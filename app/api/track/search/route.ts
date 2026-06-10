import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { query, sessionId } = await req.json()
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ ok: true })
    }

    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'
    const today = new Date().toISOString().slice(0, 10)
    const hashedIp = createHash('sha256').update(rawIp + today).digest('hex').slice(0, 16)

    await db.searchEvent.create({
      data: {
        query: query.trim().toLowerCase(),
        sessionId: sessionId || null,
        ip: hashedIp,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
