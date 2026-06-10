import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

// 简单 UA 解析
function parseUA(ua: string) {
  const lc = ua.toLowerCase()
  // 过滤爬虫
  if (/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|ahrefsbot|semrushbot/.test(lc)) {
    return null
  }

  const browser =
    /edg\//.test(lc) ? 'Edge' :
    /chrome\//.test(lc) ? 'Chrome' :
    /firefox\//.test(lc) ? 'Firefox' :
    /safari\//.test(lc) && !/chrome/.test(lc) ? 'Safari' :
    'Other'

  const device =
    /mobile|android|iphone/.test(lc) ? 'Mobile' :
    /ipad|tablet/.test(lc) ? 'Tablet' :
    'Desktop'

  return { browser, device }
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    const parsed = parseUA(ua)
    if (!parsed) return NextResponse.json({ ok: true }) // 忽略爬虫

    const { path, referrer } = await req.json()
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: true })
    }

    // 取 IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    // SHA-256(IP + 今日日期)，每天重置，保护隐私
    const today = new Date().toISOString().slice(0, 10)
    const hashedIp = createHash('sha256').update(ip + today).digest('hex').slice(0, 16)

    await db.pageView.create({
      data: {
        path,
        referrer: referrer || null,
        browser: parsed.browser,
        device: parsed.device,
        ip: hashedIp,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // 追踪失败不影响用户
  }
}
