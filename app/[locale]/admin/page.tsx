import Link from 'next/link'
import { db } from '@/lib/db'
import { AdminUmamiStats } from '@/components/admin-umami-stats'

const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 }

const gradeColor: Record<string, string> = {
  S: 'text-purple-600 border-purple-300',
  A: 'text-green-600 border-green-300',
  B: 'text-blue-600 border-blue-300',
  C: 'text-yellow-600 border-yellow-300',
  D: 'text-red-600 border-red-300',
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
    pendingSkills,
    publishedSkills,
    newSkillsToday,
    newSkillsThisWeek,
    installAgg,
    topSkills,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: weekStart } } }),
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
    pendingSkills, publishedSkills,
    newSkillsToday, newSkillsThisWeek,
    totalInstalls, top10Skills,
  }
}

export default async function AdminPage() {
  const {
    totalUsers, newUsersToday, newUsersThisWeek,
    pendingSkills, publishedSkills,
    newSkillsToday, newSkillsThisWeek,
    totalInstalls, top10Skills,
  } = await getDashboardData()

  const hasUmami = !!(process.env.UMAMI_API_KEY && process.env.UMAMI_WEBSITE_ID)

  return (
    <div className="space-y-10">

      {/* 标题 */}
      <div className="border-b border-border pb-6">
        <h1 className="font-heading text-2xl font-black tracking-tight uppercase">数据看板</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 访客数据（Umami） */}
      {hasUmami && <AdminUmamiStats />}

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
