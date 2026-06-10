import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const startAt = searchParams.get('startAt')
  const endAt = searchParams.get('endAt')
  if (!startAt || !endAt) {
    return NextResponse.json({ error: '缺少时间参数' }, { status: 400 })
  }

  const start = new Date(Number(startAt))
  const end = new Date(Number(endAt))

  const [dailyRaw, weeklyRaw] = await Promise.all([
    // 每日 DAU + PV
    db.$queryRaw<{ day: Date; dau: bigint; pv: bigint }[]>`
      SELECT
        date_trunc('day', "createdAt") AS day,
        COUNT(DISTINCT ip) AS dau,
        COUNT(*) AS pv
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY day
      ORDER BY day ASC
    `,
    // 每周 WAU + PV
    db.$queryRaw<{ week: Date; wau: bigint; pv: bigint }[]>`
      SELECT
        date_trunc('week', "createdAt") AS week,
        COUNT(DISTINCT ip) AS wau,
        COUNT(*) AS pv
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY week
      ORDER BY week ASC
    `,
  ])

  const daily = dailyRaw.map(r => ({
    date: r.day.toISOString().slice(0, 10),
    dau: Number(r.dau),
    pv: Number(r.pv),
  }))

  const weekly = weeklyRaw.map(r => ({
    week: r.week.toISOString().slice(0, 10),
    wau: Number(r.wau),
    pv: Number(r.pv),
  }))

  const avgDau = daily.length ? Math.round(daily.reduce((s, d) => s + d.dau, 0) / daily.length) : 0
  const peakDau = daily.length ? Math.max(...daily.map(d => d.dau)) : 0
  const totalPv = daily.reduce((s, d) => s + d.pv, 0)

  return NextResponse.json({ daily, weekly, avgDau, peakDau, totalPv })
}
