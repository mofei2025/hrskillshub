import { Suspense } from 'react'
import { db } from '@/lib/db'
import { SecurityGrade } from '@prisma/client'
import { SkillCard } from '@/components/skill-card'
import { SkillFilters } from '@/components/skill-filters'

async function getSkills(searchParams: Record<string, string>) {
  const { category, type, ai, sort, q, grade } = searchParams

  const where: any = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }
  if (type) where.type = type.toUpperCase()
  if (ai) where.compatibleAi = { has: ai }
  if (grade && grade !== 'ALL') where.securityGrade = grade as SecurityGrade
  if (q)
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]

  const orderBy: any =
    sort === 'downloads'
      ? { downloadCount: 'desc' }
      : sort === 'favorites'
        ? { favoriteCount: 'desc' }
        : { publishedAt: 'desc' }

  return db.skill.findMany({
    where,
    orderBy,
    include: {
      author: { select: { nickname: true } },
      category: true,
    },
  })
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const skills = await getSkills(searchParams)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">浏览 Skills</h1>

      <Suspense>
        <SkillFilters />
      </Suspense>

      <div className="mt-6">
        {skills.length === 0 ? (
          <p className="text-gray-400 text-center py-16">没有找到匹配的 Skills</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">共 {skills.length} 个</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
