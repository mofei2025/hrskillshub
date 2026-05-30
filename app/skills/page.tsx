import { Suspense } from 'react'
import { db } from '@/lib/db'
import { Prisma, SecurityGrade, SkillType } from '@prisma/client'
import { SkillCard } from '@/components/skill-card'
import { SkillFilters } from '@/components/skill-filters'

async function getSkills(searchParams: Record<string, string>) {
  const { category, type, ai, sort, q, grade } = searchParams

  const where: Prisma.SkillWhereInput = { status: 'PUBLISHED' }
  if (category) where.categories = { some: { slug: category } }
  if (ai) where.compatibleAi = { has: ai }

  // grade 枚举白名单校验
  const VALID_GRADES: SecurityGrade[] = ['A', 'B', 'C', 'PENDING']
  if (grade && grade !== 'ALL' && VALID_GRADES.includes(grade as SecurityGrade)) {
    where.securityGrade = grade as SecurityGrade
  }

  // type 枚举白名单校验
  const VALID_TYPES: SkillType[] = ['PROMPT', 'CLAUDE_SKILL']
  if (type && VALID_TYPES.includes(type.toUpperCase() as SkillType)) {
    where.type = type.toUpperCase() as SkillType
  }

  if (q)
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]

  const orderBy: Prisma.SkillOrderByWithRelationInput =
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
      categories: { orderBy: { order: 'asc' } },
    },
  })
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const [skills, categories] = await Promise.all([
    getSkills(searchParams),
    db.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">浏览 Skills</h1>

      <Suspense fallback={<div className="h-20 bg-muted animate-pulse" />}>
        <SkillFilters categories={categories} />
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
