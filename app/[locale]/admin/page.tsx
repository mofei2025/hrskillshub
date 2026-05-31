import Link from 'next/link'
import { db } from '@/lib/db'

const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 }

const UMAMI_API = 'https://api.umami.is/v1'
const UMAMI_KEY = process.env.UMAMI_API_KEY ?? ''
const UMAMI_SITE = process.env.UMAMI_WEBSITE_ID ?? ''

// 获取 Umami 访客数据
async function getUmamiData() {
  if (!UMAMI_KEY || !UMAMI_SITE) return null

  const headers = { 'x-umami-api-key': UMAMI_KEY }
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const qs = `startAt=${weekAgo}&endAt=${now}`

  try {
    const [activeRes, statsRes, pagesRes, referrersRes, browsersRes, devicesRes] = await Promise.all([
      fetch(`${UMAMI_API}/websites/${UMAMI_SITE}/active`, { headers, next: { revalidate: 60 } }),
      fetch(`${UMAMI_API}/websites/${UMAMI_SITE}/stats?startAt=${dayAgo}&endAt=${now}`, { headers, next: { revalidate: 300 } }),
      fetch(`${UMAMI_API}/websites/${UMAMI_SITE}/metrics?type=url&${qs}&limit=8`, { headers, next: { revalidate: 300 } }),
      fetch(`${UMAMI_API}/websites/${UMAMI_SITE}/metrics?type=referrer&${qs}&limit=6`, { headers, next: { revalidate: 300 } }),
      fetch(`${UMAMI_API}/websites/${UMAMI_SITE}/metrics?type=browser&${qs}&limit=5`, { headers, next: { revalidate: 300 } }),
      fetch(`${UMAMI_API}/websites/${UMAMI_SITE}/metrics?type=device&${qs}&limit=5`, { headers, next: { revalidate: 300 } }),
    ])

    const [active, stats, pages, referrers, browsers, devices] = await Promise.all([
      activeRes.ok ? activeRes.json() : null,
      statsRes.ok ? statsRes.json() : null,
      pagesRes.ok ? pagesRes.json() : null,
      referrersRes.ok ? referrersRes.json() : null,
      browsersRes.ok ? browsersRes.json() : null,
      devicesRes.ok ? devicesRes.json() : null,
    ])

    return { active, stats, pages, referrers, browsers, devices }
  } catch {
    return null
  }
}

async function getDashboardData() {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    totalSkills,
    pendingSkills,
    publishedSkills,
    newSkillsToday,
    newSkillsThisWeek,
    installAgg,
    topSkills,
    umami,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: weekStart } } }),
    db.skill.count(),
    db.skill.count({ where: { status: 'PENDING' } }),
    db.skill.count({ where: { status: 'PUBLISHED' } }),
    db.skill.count({ where: { createdAt: { gte: todayStart } } }),
    db.skill.count({ where: { createdAt: { gte: weekStart } } }),
    db.skill.aggregate({ _sum: { installCount: true }, where: { status: 'PUBLISHED' } }),
    db.skill.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { installCount: 'desc' },
      take: 20,
      select: { id: true, title: true, installCount: true, securityGrade: true },
    }),
    getUmamiData(),
  ])

  const totalInstalls = installAgg._sum.installCount ?? 0

  const top10Skills = [...topSkills]
    .sort((a, b) => {
      if (b.installCount !== a.installCount) return b.installCount - a.installCount
      return (gradeOrder[a.securityGrade ?? 'D'] ?? 4) - (gradeOrder[b.securityGrade ?? 'D'] ?? 4)
    })
    .slice(0, 10)

  return {
    totalUsers, newUsersToday, newUsersThisWeek,
    totalSkills, pendingSkills, publishedSkills,
    newSkillsToday, newSkillsThisWeek,
    totalInstalls, top10Skills, umami,
  }
}

const gradeColor: Record<string, string> = {
  S: 'text-purple-600 border-purple-300',
  A: 'text-green-600 border-green-300',
  B: 'text-blue-600 border-blue-300',
  C: 'text-yellow-600 border-yellow-300',
  D: 'text-red-600 border-red-300',
}

export default async function AdminPage() {
  const {
    totalUsers, newUsersToday, newUsersThisWeek,
    totalSkills, pendingSkills, publishedSkills,
    newSkillsToday, newSkillsThisWeek,
    totalInstalls, top10Skills, umami,
  } = await getDashboardData()

  // 解析 Umami 数据
  const activeVisitors = umami?.active?.visitors ?? 0
  const pageviews = umami?.stats?.pageviews?.value ?? 0
  const visitors = umami?.stats?.visitors?.value ?? 0
  const bounceRate = umami?.stats?.bounces?.value && umami?.stats?.visits?.value
    ? Math.round((umami.stats.bounces.value / umami.stats.visits.value) * 100)
    : null
  const avgDuration = umami?.stats?.totaltime?.value && umami?.stats?.visits?.value
    ? Math.round(umami.stats.totaltime.value / umami.stats.visits.value)
    : null

  const topPages: { x: string; y: number }[] = umami?.pages ?? []
  const topReferrers: { x: string; y: number }[] = umami?.referrers ?? []
  const topBrowsers: { x: string; y: number }[] = umami?.browsers ?? []
  const topDevices: { x: string; y: number }[] = umami?.devices ?? []

  return (
    <div className="space-y-10">

      {/* 标题 */}
      <div className="border-b border-border pb-6">
        <h1 className="font-heading text-2xl font-black tracking-tight uppercase">数据看板</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 访客实时数据 */}
      {umami && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">访客数据</h2>
            <span className="text-xs font-mono text-muted-foreground">· 过去 24 小时</span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              {activeVisitors} 人在线
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {[
              { label: '页面浏览量', value: pageviews.toLocaleString(), sub: 'PV' },
              { label: '独立访客', value: visitors.toLocaleString(), sub: 'UV' },
              { label: '跳出率', value: bounceRate !== null ? `${bounceRate}%` : '-', sub: '单页即离开' },
              { label: '平均访问时长', value: avgDuration !== null ? `${avgDuration}s` : '-', sub: '每次会话' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-card p-6">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
                <p className="font-heading text-4xl font-black text-foreground">{value}</p>
                <p className="text-xs mt-2 font-mono text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* 页面 + 来源 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0">
            {/* 热门页面 */}
            <div className="bg-card p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">热门页面 · 近 7 天</p>
              <div className="space-y-2">
                {topPages.length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
                {topPages.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-foreground font-mono flex-1 truncate">{p.x || '/'}</span>
                    <span className="font-mono text-xs text-brand font-medium">{p.y.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 访客来源 */}
            <div className="bg-card p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">访客来源 · 近 7 天</p>
              <div className="space-y-2">
                {topReferrers.length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据（或来自直接访问）</p>}
                {topReferrers.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-foreground font-mono flex-1 truncate">{r.x || '直接访问'}</span>
                    <span className="font-mono text-xs text-brand font-medium">{r.y.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 浏览器 + 设备 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0">
            <div className="bg-card p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">浏览器 · 近 7 天</p>
              <div className="space-y-2">
                {topBrowsers.length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
                {topBrowsers.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-foreground font-mono flex-1">{b.x || '未知'}</span>
                    <span className="font-mono text-xs text-brand font-medium">{b.y.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">设备类型 · 近 7 天</p>
              <div className="space-y-2">
                {topDevices.length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
                {topDevices.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-foreground font-mono flex-1">{d.x || '未知'}</span>
                    <span className="font-mono text-xs text-brand font-medium">{d.y.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 用户数据 */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">用户数据</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {[
            { label: '总注册用户', value: totalUsers, sub: null, href: '/admin/users', urgent: false },
            { label: '今日新增', value: newUsersToday, sub: '今天', href: '/admin/users', urgent: false },
            { label: '本周新增', value: newUsersThisWeek, sub: '近 7 天', href: '/admin/users', urgent: false },
            { label: '待审核', value: pendingSkills, sub: pendingSkills > 0 ? '需要处理' : '暂无', href: '/admin/reviews', urgent: pendingSkills > 0 },
          ].map(({ label, value, sub, href, urgent }) => (
            <Link key={label} href={href}>
              <div className={`bg-card p-6 h-full hover:bg-[var(--hero-bg)] transition-colors ${urgent ? 'border-l-2 border-l-amber-400' : ''}`}>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
                <p className={`font-heading text-4xl font-black ${urgent ? 'text-amber-500' : 'text-foreground'}`}>{value}</p>
                {sub && <p className={`text-xs mt-2 font-mono ${urgent ? 'text-amber-500' : 'text-muted-foreground'}`}>{sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Skills 数据 */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">Skills 数据</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {[
            { label: '已发布', value: publishedSkills, sub: '对外可见', href: '/admin/skills' },
            { label: '总安装次数', value: totalInstalls.toLocaleString(), sub: '所有 Skills 累计', href: '/admin/skills' },
            { label: '今日新提交', value: newSkillsToday, sub: '今天', href: '/admin/reviews' },
            { label: '本周新提交', value: newSkillsThisWeek, sub: '近 7 天', href: '/admin/reviews' },
          ].map(({ label, value, sub, href }) => (
            <Link key={label} href={href}>
              <div className="bg-card p-6 h-full hover:bg-[var(--hero-bg)] transition-colors">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
                <p className="font-heading text-4xl font-black text-brand">{value}</p>
                {sub && <p className="text-xs mt-2 font-mono text-muted-foreground">{sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 安装排行 TOP 10 */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">安装次数 TOP 10</h2>
        <div className="border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-[var(--hero-bg)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Skill 名称</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground w-16">评级</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground w-24">安装</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top10Skills.map((skill, idx) => (
                <tr key={skill.id} className="hover:bg-[var(--hero-bg)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href="/admin/skills" className="font-medium text-foreground hover:text-brand transition-colors">
                      {skill.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {skill.securityGrade && skill.securityGrade !== 'PENDING' && (
                      <span className={`text-xs font-mono border px-1.5 py-0.5 ${gradeColor[skill.securityGrade] ?? 'text-muted-foreground border-border'}`}>
                        {skill.securityGrade}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium text-foreground">
                    {skill.installCount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {top10Skills.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground text-sm font-mono">
                    暂无已发布的 Skills
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 快捷操作 */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/admin/reviews', label: '审核队列', urgent: pendingSkills > 0, count: pendingSkills },
            { href: '/admin/skills', label: 'Skills 管理', urgent: false, count: 0 },
            { href: '/admin/users', label: '用户管理', urgent: false, count: 0 },
            { href: '/admin/categories', label: '分类管理', urgent: false, count: 0 },
          ].map(({ href, label, urgent, count }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm border px-4 py-2 font-medium transition-colors ${
                urgent
                  ? 'border-amber-400 text-amber-600 hover:bg-amber-50'
                  : 'border-border text-foreground hover:border-foreground hover:bg-[var(--hero-bg)]'
              }`}
            >
              {label}
              {urgent && count > 0 && (
                <span className="ml-2 text-xs bg-amber-500 text-white px-1.5 py-0.5 font-mono">{count}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
