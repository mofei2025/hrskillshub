import Link from 'next/link'
import { db } from '@/lib/db'

const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 }

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
  ])

  const totalInstalls = installAgg._sum.installCount ?? 0

  // 安装次数相同时按安全评级排
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
    totalInstalls, top10Skills,
  }
}

export default async function AdminPage() {
  const {
    totalUsers, newUsersToday, newUsersThisWeek,
    totalSkills, pendingSkills, publishedSkills,
    newSkillsToday, newSkillsThisWeek,
    totalInstalls, top10Skills,
  } = await getDashboardData()

  const gradeColor: Record<string, string> = {
    S: 'text-purple-600 bg-purple-50 border-purple-200',
    A: 'text-green-600 bg-green-50 border-green-200',
    B: 'text-blue-600 bg-blue-50 border-blue-200',
    C: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    D: 'text-red-600 bg-red-50 border-red-200',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">数据看板</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 用户数据 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">用户</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '总注册用户', value: totalUsers, sub: null, href: '/admin/users' },
            { label: '今日新增用户', value: newUsersToday, sub: null, href: '/admin/users' },
            { label: '本周新增用户', value: newUsersThisWeek, sub: '近 7 天', href: '/admin/users' },
            { label: '待审核 Skills', value: pendingSkills, sub: pendingSkills > 0 ? '需要处理' : null, href: '/admin/reviews', urgent: pendingSkills > 0 },
          ].map(({ label, value, sub, href, urgent }) => (
            <Link key={label} href={href}>
              <div className={`rounded-lg border p-5 hover:shadow-sm transition-shadow cursor-pointer ${urgent ? 'border-amber-300 bg-amber-50' : 'bg-white'}`}>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${urgent ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
                {sub && <p className={`text-xs mt-1 ${urgent ? 'text-amber-600' : 'text-gray-400'}`}>{sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Skills 数据 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Skills</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '已发布 Skills', value: publishedSkills, sub: null, href: '/admin/skills' },
            { label: '总安装次数', value: totalInstalls.toLocaleString(), sub: '所有 Skills 累计', href: '/admin/skills' },
            { label: '今日新提交', value: newSkillsToday, sub: null, href: '/admin/reviews' },
            { label: '本周新提交', value: newSkillsThisWeek, sub: '近 7 天', href: '/admin/reviews' },
          ].map(({ label, value, sub, href }) => (
            <Link key={label} href={href}>
              <div className="rounded-lg border bg-white p-5 hover:shadow-sm transition-shadow cursor-pointer">
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 安装排行 TOP 10 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          安装次数 TOP 10
        </h2>
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-10">排名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Skill 名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">评级</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">安装次数</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {top10Skills.map((skill, idx) => (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {idx < 3
                      ? ['🥇', '🥈', '🥉'][idx]
                      : <span className="text-gray-400">#{idx + 1}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/skills`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {skill.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {skill.securityGrade && (
                      <span className={`text-xs font-mono border px-1.5 py-0.5 rounded ${gradeColor[skill.securityGrade] ?? 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                        {skill.securityGrade}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                    {skill.installCount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {top10Skills.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
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
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/admin/reviews', label: '审核队列', urgent: pendingSkills > 0 },
            { href: '/admin/skills', label: 'Skills 管理' },
            { href: '/admin/users', label: '用户管理' },
            { href: '/admin/categories', label: '分类管理' },
          ].map(({ href, label, urgent }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm border px-4 py-2 rounded transition-colors ${
                urgent
                  ? 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
              {urgent && <span className="ml-1.5 text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5">{pendingSkills}</span>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
