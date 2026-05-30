import { db } from '@/lib/db'
import { CategoryActions } from './category-actions'

async function getCategories() {
  return db.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { skills: true } } },
  })
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        分类管理
        <span className="ml-2 text-sm font-normal text-gray-500">共 {categories.length} 个</span>
      </h1>
      <CategoryActions categories={categories} />
    </div>
  )
}
