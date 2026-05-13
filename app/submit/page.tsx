import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SubmitTabs } from '@/components/submit-tabs'

export default async function SubmitPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const categories = await db.category.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">分享你的 Skill</h1>
      <p className="text-gray-500 mb-6">
        选择最适合你的方式上传。普通用户提交后需经过审核才会发布。
      </p>
      <SubmitTabs categories={categories} />
    </div>
  )
}
