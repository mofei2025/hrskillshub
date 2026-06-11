import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const PRESET_KEYWORDS = ['面试话术', '绩效评估', '薪酬分析', '入职培训', 'OKR 助手', 'okr 助手', 'OKR助手', 'okr助手', '离职分析']

const PROVINCE_MAP: Record<string, string> = {
  BJ: '北京市', TJ: '天津市', HE: '河北省', SX: '山西省', NM: '内蒙古自治区',
  LN: '辽宁省', JL: '吉林省', HL: '黑龙江省', SH: '上海市', JS: '江苏省',
  ZJ: '浙江省', AH: '安徽省', FJ: '福建省', JX: '江西省', SD: '山东省',
  HA: '河南省', HB: '湖北省', HN: '湖南省', GD: '广东省', GX: '广西壮族自治区',
  HI: '海南省', CQ: '重庆市', SC: '四川省', GZ: '贵州省', YN: '云南省',
  XZ: '西藏自治区', SN: '陕西省', GS: '甘肃省', QH: '青海省', NX: '宁夏回族自治区',
  XJ: '新疆维吾尔自治区', TW: '台湾省', HK: '香港特别行政区', MO: '澳门特别行政区',
}

function getProvinceName(code: string | null): string {
  if (!code) return '未知'
  const key = code.replace(/^CN-/, '')
  return PROVINCE_MAP[key] ?? code
}

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

  const [
    allViews,
    activeViews,
    pageGroups,
    referrerGroups,
    browserGroups,
    deviceGroups,
    provinceGroups,
    skillViewGroups,
    sessionViews,
    searchKeywords,
    registrations,
    installs,
    favorites,
    comments,
    hourlyRaw,
    avgSessionRaw,
  ] = await Promise.all([
    // 总 PV/UV
    db.pageView.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { ip: true, ipPersist: true },
    }),
    // 实时在线
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
    // 设备
    db.pageView.groupBy({
      by: ['device'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
      take: 5,
    }),
    // 省份
    db.pageView.groupBy({
      by: ['province'],
      where: { createdAt: { gte: start, lte: end }, province: { not: null } },
      _count: { province: true },
      orderBy: { _count: { province: 'desc' } },
      take: 10,
    }),
    // 技能详情页
    db.pageView.groupBy({
      by: ['skillId'],
      where: { createdAt: { gte: start, lte: end }, skillId: { not: null } },
      _count: { skillId: true },
      orderBy: { _count: { skillId: 'desc' } },
      take: 8,
    }),
    // 路径分析（含 sessionId 的记录）
    db.pageView.findMany({
      where: { createdAt: { gte: start, lte: end }, sessionId: { not: null } },
      select: { sessionId: true, path: true, createdAt: true },
      orderBy: [{ sessionId: 'asc' }, { createdAt: 'asc' }],
    }),
    // 搜索关键词
    db.searchEvent.groupBy({
      by: ['query'],
      where: {
        createdAt: { gte: start, lte: end },
        NOT: { query: { in: PRESET_KEYWORDS } },
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    }),
    // 转化漏斗：注册
    db.user.count({ where: { createdAt: { gte: start, lte: end } } }),
    // 转化漏斗：安装
    db.download.count({ where: { createdAt: { gte: start, lte: end } } }),
    // 转化漏斗：收藏
    db.favorite.count({ where: { createdAt: { gte: start, lte: end } } }),
    // 转化漏斗：评论
    db.comment.count({ where: { createdAt: { gte: start, lte: end } } }),
    // 每小时 PV 趋势（原生 SQL）
    db.$queryRaw<{ hour: Date; count: bigint }[]>`
      SELECT date_trunc('hour', "createdAt") AS hour, COUNT(*) AS count
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY hour
      ORDER BY hour ASC
    `,
    // 平均会话时长（按 sessionId 汇总各页停留时长，再取平均）
    db.$queryRaw<{ avg_duration: number | null }[]>`
      SELECT AVG(session_total) AS avg_duration
      FROM (
        SELECT "sessionId", SUM("duration") AS session_total
        FROM "PageView"
        WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
          AND "sessionId" IS NOT NULL
          AND "duration" IS NOT NULL AND "duration" > 0
        GROUP BY "sessionId"
      ) t
    `,
  ])

  // 基础指标
  const pageviews = allViews.length
  const visitors = new Set(allViews.map(v => v.ip)).size
  const active = new Set(activeViews.map(v => v.ip)).size

  // 新访客 vs 回访（基于 ipPersist）
  const allPersistIps = allViews.map(v => v.ipPersist).filter(Boolean) as string[]
  const uniquePersistIps = Array.from(new Set(allPersistIps))
  let newVisitors = 0
  let returningVisitors = 0
  if (uniquePersistIps.length > 0) {
    const seenBefore = await db.pageView.findMany({
      where: {
        ipPersist: { in: uniquePersistIps },
        createdAt: { lt: start },
      },
      select: { ipPersist: true },
      distinct: ['ipPersist'],
    })
    const seenBeforeSet = new Set(seenBefore.map(v => v.ipPersist))
    uniquePersistIps.forEach(ip => {
      if (seenBeforeSet.has(ip)) returningVisitors++
      else newVisitors++
    })
  }

  // 路径流向分析
  const sessionMap: Record<string, string[]> = {}
  for (const v of sessionViews) {
    if (!v.sessionId) continue
    if (!sessionMap[v.sessionId]) sessionMap[v.sessionId] = []
    sessionMap[v.sessionId].push(v.path)
  }
  const flowCounts: Record<string, number> = {}
  for (const paths of Object.values(sessionMap)) {
    for (let i = 0; i < paths.length - 1; i++) {
      const key = `${paths[i]}|||${paths[i + 1]}`
      flowCounts[key] = (flowCounts[key] || 0) + 1
    }
  }
  const pathFlows = Object.entries(flowCounts)
    .map(([key, count]) => {
      const [from, to] = key.split('|||')
      return { from, to, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 技能详情页关联标题
  const skillIds = skillViewGroups.map(g => g.skillId!).filter(Boolean)
  const skills = skillIds.length > 0
    ? await db.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, title: true } })
    : []
  const skillMap = Object.fromEntries(skills.map(s => [s.id, s.title]))
  const skillViews = skillViewGroups.map(g => ({
    skillId: g.skillId!,
    title: skillMap[g.skillId!] ?? '未知',
    views: g._count.skillId,
  }))

  // 平均会话时长（秒，取整）
  const avgSessionDuration = Math.round(Number(avgSessionRaw[0]?.avg_duration ?? 0))

  // 每小时趋势格式化
  const hourlyTrend = hourlyRaw.map(r => ({
    hour: r.hour.toISOString(),
    count: Number(r.count),
  }))

  return NextResponse.json({
    active,
    pageviews,
    visitors,
    pages: pageGroups.map(g => ({ x: g.path, y: g._count.path })),
    referrers: referrerGroups.map(g => ({ x: g.referrer ?? '', y: g._count.referrer })),
    browsers: browserGroups.map(g => ({ x: g.browser ?? '未知', y: g._count.browser })),
    devices: deviceGroups.map(g => ({ x: g.device ?? '未知', y: g._count.device })),
    provinces: provinceGroups.map(g => ({ x: getProvinceName(g.province), y: g._count.province })),
    skillViews,
    pathFlows,
    searchKeywords: searchKeywords.map(g => ({ query: g.query, count: g._count.query })),
    hourlyTrend,
    avgSessionDuration,
    newVisitors,
    returningVisitors,
    funnel: {
      visitors,
      registrations,
      installs,
      favorites,
      comments,
    },
  })
}
