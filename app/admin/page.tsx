import Link from 'next/link'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'

async function getStats() {
  const [pendingCount, publishedCount, userCount, categoryCount] =
    await Promise.all([
      db.skill.count({ where: { status: 'PENDING' } }),
      db.skill.count({ where: { status: 'PUBLISHED' } }),
      db.user.count(),
      db.category.count(),
    ])
  return { pendingCount, publishedCount, userCount, categoryCount }
}

export default async function AdminPage() {
  const { pendingCount, publishedCount, userCount, categoryCount } =
    await getStats()

  const stats = [
    { label: '待审核 Skills', value: pendingCount, href: '/admin/reviews', urgent: pendingCount > 0 },
    { label: '已发布 Skills', value: publishedCount, href: '/admin/skills', urgent: false },
    { label: '注册用户', value: userCount, href: '/admin/users', urgent: false },
    { label: '分类总数', value: categoryCount, href: '/admin/categories', urgent: false },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台总览</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, href, urgent }) => (
          <Link key={href} href={href}>
            <div
              className={`rounded-lg border p-5 hover:shadow-sm transition-shadow cursor-pointer ${
                urgent ? 'border-amber-300 bg-amber-50' : 'bg-white'
              }`}
            >
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${urgent ? 'text-amber-600' : 'text-gray-900'}`}>
                {value}
              </p>
              {urgent && <p className="text-xs text-amber-600 mt-1">需要处理</p>}
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">快捷操作</h2>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/reviews"><Button variant="outline">查看审核队列</Button></Link>
        <Link href="/admin/skills"><Button variant="outline">管理 Skills</Button></Link>
        <Link href="/admin/users"><Button variant="outline">管理用户</Button></Link>
        <Link href="/admin/categories"><Button variant="outline">管理分类</Button></Link>
      </div>
    </div>
  )
}
