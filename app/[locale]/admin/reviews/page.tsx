import { db } from '@/lib/db'
import { ReviewActions } from './review-actions'

async function getPendingSkills() {
  return db.skill.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { nickname: true, email: true } },
      categories: { select: { name: true }, orderBy: { order: 'asc' } },
    },
  })
}

export default async function ReviewsPage() {
  const skills = await getPendingSkills()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        审核队列
        <span className="ml-2 text-sm font-normal text-gray-500">{skills.length} 条待审核</span>
      </h1>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center text-gray-400">
          暂无待审核的 Skill，队列已清空
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => (
            <ReviewActions key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
