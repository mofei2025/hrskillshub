import Link from 'next/link'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

async function getHomeData() {
  const [hotSkills, categories] = await Promise.all([
    db.skill.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { downloadCount: 'desc' },
      take: 6,
      include: {
        author: { select: { nickname: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: 'asc' } }),
  ])
  return { hotSkills, categories }
}

export default async function HomePage() {
  const { hotSkills, categories } = await getHomeData()

  return (
    <div>
      {/* 英雄区 */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            HR 专属的 AI Skills 分享平台
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            找到适合你的 AI 提示词和 Skills，让 DeepSeek、ChatGPT、Claude 成为你的 HR 助手
          </p>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link href="/skills" className="flex-1">
              <Button size="lg" variant="secondary" className="w-full gap-2">
                <Search className="h-4 w-4" />
                浏览所有 Skills
              </Button>
            </Link>
            <Link href="/submit">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-700">
                分享我的 Skill
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 分类入口 */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-4">按场景浏览</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Link key={cat.id} href={`/skills?category=${cat.slug}`}>
              <Button variant="outline" size="sm">{cat.name}</Button>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门 Skills */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">热门 Skills</h2>
          <Link href="/skills" className="text-sm text-blue-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        {hotSkills.length === 0 ? (
          <p className="text-gray-400 text-center py-12">还没有 Skills，快来分享第一个吧！</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
