import Link from 'next/link'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'

// 分类图标映射（slug → emoji）
const categoryIcons: Record<string, string> = {
  recruitment: '🎯',
  performance: '📊',
  compensation: '💰',
  training: '📚',
  culture: '🌟',
  compliance: '⚖️',
}

async function getHomeData() {
  const [categories, featuredSkills, stats] = await Promise.all([
    db.category.findMany({
      include: { _count: { select: { skills: { where: { status: 'PUBLISHED' } } } } },
      orderBy: { name: 'asc' },
    }),
    db.skill.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        categories: { orderBy: { order: 'asc' } },
        author: { select: { nickname: true } },
      },
      orderBy: { installCount: 'desc' },
      take: 9,
    }),
    Promise.all([
      db.skill.count({ where: { status: 'PUBLISHED' } }),
      db.skill.aggregate({ _sum: { installCount: true }, where: { status: 'PUBLISHED' } }),
      db.user.count(),
      db.skill.count({ where: { status: 'PUBLISHED', securityGrade: 'A' } }),
    ]),
  ])

  const [totalSkills, installAgg, totalUsers, gradeACount] = stats
  const totalInstalls = installAgg._sum.installCount ?? 0
  const gradeAPercent = totalSkills > 0 ? Math.round((gradeACount / totalSkills) * 100) : 0

  return { categories, featuredSkills, totalSkills, totalInstalls, totalUsers, gradeAPercent }
}

export default async function HomePage() {
  const { categories, featuredSkills, totalSkills, totalInstalls, totalUsers, gradeAPercent } =
    await getHomeData()

  return (
    <div className="min-h-screen">
      {/* ===== 英雄区 ===== */}
      <section
        className="bg-[var(--hero-bg)] border-b border-border py-20 px-4"
        style={{
          backgroundImage: `
            linear-gradient(var(--card-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--card-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand border border-brand px-3 py-1">
              HR AI Skills Marketplace
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl font-black leading-tight mb-4 tracking-tight">
            发现最好的
            <br />
            <span className="text-brand">HR AI Skills</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            精选 {totalSkills}+ 个经过安全审核的 HR 提示词与技能包
          </p>

          {/* 搜索框 */}
          <form action="/skills" method="get" className="max-w-2xl mx-auto mb-8">
            <div className="flex">
              <input
                name="q"
                type="text"
                placeholder="搜索 Skills，例如：面试话术、OKR 助手、绩效评估…"
                className="flex-1 px-4 py-3 text-sm border-[2px] border-foreground bg-card focus:outline-none focus:border-brand transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand text-white text-sm font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                搜索
              </button>
            </div>
          </form>

          {/* 热门搜索标签 */}
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            {['面试话术', 'OKR 助手', '绩效评估', '薪酬分析', '入职培训', '离职分析'].map((tag) => (
              <Link
                key={tag}
                href={`/skills?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 border border-border hover:border-brand hover:text-brand transition-colors text-muted-foreground"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 统计数字 ===== */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { value: `${totalSkills}+`, label: 'Skills' },
              {
                value: totalInstalls >= 1000
                  ? `${(totalInstalls / 1000).toFixed(1)}k`
                  : String(totalInstalls),
                label: '次安装',
              },
              { value: `${totalUsers.toLocaleString()}`, label: '贡献者' },
              { value: `${gradeAPercent}%`, label: 'S 级' },
            ].map(({ value, label }) => (
              <div key={label} className="py-6 px-8 text-center">
                <div className="font-heading text-2xl font-black text-brand">{value}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 分类网格 ===== */}
      <section className="border-b border-border py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-xl font-black mb-6 uppercase tracking-tight">
            按分类浏览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/skills?category=${cat.slug}`}
                className="bg-card hover:bg-brand hover:text-white group p-6 text-center transition-colors"
              >
                <div className="text-2xl mb-2">{categoryIcons[cat.slug] ?? '📌'}</div>
                <div className="text-sm font-medium group-hover:text-white">{cat.name}</div>
                <div className="text-xs text-muted-foreground group-hover:text-white/70 mt-1">
                  {cat._count.skills} Skills
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Skills 网格 ===== */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-black uppercase tracking-tight">
              热门 Skills
            </h2>
            <Link
              href="/skills"
              className="text-sm text-muted-foreground hover:text-brand transition-colors"
            >
              查看全部 →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {featuredSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
