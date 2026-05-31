import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const UMAMI_API = 'https://api.umami.is/v1'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const key = process.env.UMAMI_API_KEY
  const siteId = process.env.UMAMI_WEBSITE_ID
  if (!key || !siteId) {
    return NextResponse.json({ error: '未配置 Umami' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const startAt = searchParams.get('startAt')
  const endAt = searchParams.get('endAt')

  if (!startAt || !endAt) {
    return NextResponse.json({ error: '缺少时间参数' }, { status: 400 })
  }

  const headers = { 'x-umami-api-key': key }
  const qs = `startAt=${startAt}&endAt=${endAt}`

  try {
    const [activeRes, statsRes, pagesRes, referrersRes, browsersRes, devicesRes] = await Promise.all([
      fetch(`${UMAMI_API}/websites/${siteId}/active`, { headers }),
      fetch(`${UMAMI_API}/websites/${siteId}/stats?${qs}`, { headers }),
      fetch(`${UMAMI_API}/websites/${siteId}/metrics?type=url&${qs}&limit=8`, { headers }),
      fetch(`${UMAMI_API}/websites/${siteId}/metrics?type=referrer&${qs}&limit=6`, { headers }),
      fetch(`${UMAMI_API}/websites/${siteId}/metrics?type=browser&${qs}&limit=5`, { headers }),
      fetch(`${UMAMI_API}/websites/${siteId}/metrics?type=device&${qs}&limit=5`, { headers }),
    ])

    const [active, stats, pages, referrers, browsers, devices] = await Promise.all([
      activeRes.ok ? activeRes.json() : null,
      statsRes.ok ? statsRes.json() : null,
      pagesRes.ok ? pagesRes.json() : null,
      referrersRes.ok ? referrersRes.json() : null,
      browsersRes.ok ? browsersRes.json() : null,
      devicesRes.ok ? devicesRes.json() : null,
    ])

    return NextResponse.json({ active, stats, pages, referrers, browsers, devices })
  } catch {
    return NextResponse.json({ error: '请求 Umami 失败' }, { status: 500 })
  }
}
