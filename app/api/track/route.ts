import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import geoip from 'geoip-lite'

const IP_PERSIST_SALT = 'hrskillshub-analytics-v1'

// 简单 UA 解析
function parseUA(ua: string) {
  const lc = ua.toLowerCase()
  if (/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|ahrefsbot|semrushbot|bytespider/.test(lc)) {
    return null
  }
  const browser =
    /edg\//.test(lc) ? 'Edge' :
    /chrome\//.test(lc) ? 'Chrome' :
    /firefox\//.test(lc) ? 'Firefox' :
    /safari\//.test(lc) && !/chrome/.test(lc) ? 'Safari' :
    'Other'
  let device: string
  if (/iphone/.test(lc)) device = 'iPhone'
  else if (/ipad/.test(lc)) device = 'iPad'
  else if (/android/.test(lc) && /mobile/.test(lc)) device = 'Android'
  else if (/android/.test(lc)) device = 'Android Tablet'
  else if (/macintosh|mac os x/.test(lc)) device = 'Mac'
  else if (/windows/.test(lc)) device = 'Windows'
  else if (/linux/.test(lc)) device = 'Linux'
  else device = 'Desktop'
  return { browser, device }
}

// 从路径解析技能 ID
function parseSkillId(path: string): string | null {
  const match = path.match(/\/skills\/([^/?#]+)/)
  if (!match) return null
  // 排除非 ID 的路径段
  if (['page', 'new', 'edit'].includes(match[1])) return null
  return match[1]
}

// 判断是否是私有 IP
function isPrivateIP(ip: string) {
  return (
    ip === 'unknown' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('::ffff:192.168.') ||
    ip.startsWith('::ffff:10.')
  )
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    const parsed = parseUA(ua)
    if (!parsed) return NextResponse.json({ ok: true }) // 忽略爬虫

    const { path, referrer, sessionId, prevViewId, prevDuration } = await req.json()
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: true })
    }

    // 取原始 IP（优先 x-real-ip，它在 nginx 反代场景下最准确）
    const rawIp =
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.ip ??
      'unknown'

    // 地理位置解析（先解析再哈希，不存原始 IP）
    let province: string | null = null
    let city: string | null = null
    if (!isPrivateIP(rawIp)) {
      const geo = geoip.lookup(rawIp)
      if (geo) {
        province = geo.region || null
        city = geo.city || null
      }
    }

    // 日维度 UV 哈希（每天重置）
    const today = new Date().toISOString().slice(0, 10)
    const hashedIp = createHash('sha256').update(rawIp + today).digest('hex').slice(0, 16)

    // 跨天稳定哈希（新/回访判断）
    const ipPersist = createHash('sha256').update(rawIp + IP_PERSIST_SALT).digest('hex').slice(0, 16)

    const skillId = parseSkillId(path)

    // 更新前一个页面的停留时长
    if (prevViewId && typeof prevDuration === 'number' && prevDuration > 0 && prevDuration < 3600) {
      await db.pageView.updateMany({
        where: { id: prevViewId },
        data: { duration: Math.round(prevDuration) },
      })
    }

    // 创建新访问记录
    const view = await db.pageView.create({
      data: {
        path,
        referrer: referrer || null,
        browser: parsed.browser,
        device: parsed.device,
        ip: hashedIp,
        ipPersist,
        sessionId: sessionId || null,
        skillId,
        province,
        city,
      },
    })

    return NextResponse.json({ ok: true, viewId: view.id })
  } catch {
    return NextResponse.json({ ok: true }) // 追踪失败不影响用户
  }
}
