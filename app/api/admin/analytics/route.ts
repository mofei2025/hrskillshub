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
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

  const [allViews, activeViews, pageGroups, referrerGroups, browserGroups, deviceGroups] =
    await Promise.all([
      // 总 PV 和 UV
      db.pageView.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { ip: true },
      }),
      // 实时在线（5分钟内不同 IP 数量）
      db.pageView.findMany({
        where: { createdAt: { gte: fiveMinAgo } },
        select: { ip: true },
      }),
      // 热门页面
      db.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 8,
      }),
      // 访客来源
      db.pageView.groupBy({
        by: ['referrer'],
        where: { createdAt: { gte: start, lte: end }, referrer: { not: null } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 6,
      }),
      // 浏览器
      db.pageView.groupBy({
        by: ['browser'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { browser: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 5,
      }),
      // 设备类型
      db.pageView.groupBy({
        by: ['device'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { device: true },
        orderBy: { _count: { device: 'desc' } },
        take: 5,
      }),
    ])

  const pageviews = allViews.length
  const visitors = new Set(allViews.map(v => v.ip)).size
  const active = new Set(activeViews.map(v => v.ip)).size

  return NextResponse.json({
    active,
    pageviews,
    visitors,
    pages: pageGroups.map(g => ({ x: g.path, y: g._count.path })),
    referrers: referrerGroups.map(g => ({ x: g.referrer ?? '', y: g._count.referrer })),
    browsers: browserGroups.map(g => ({ x: g.browser ?? '未知', y: g._count.browser })),
    devices: deviceGroups.map(g => ({ x: g.device ?? '未知', y: g._count.device })),
  })
}
