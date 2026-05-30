import { Suspense } from 'react'
import { db } from '@/lib/db'
import { Prisma, SecurityGrade, SkillType } from '@prisma/client'
import { SkillCard } from '@/components/skill-card'
import { SkillFilters } from '@/components/skill-filters'

async function getCategories() {
  return db.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
}

async function getSkills(searchParams: Record<string, string>) {
  const { category, type, sort, q, grade } = searchParams

  const where: Prisma.SkillWhereInput = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }

  const VALID_GRADES: SecurityGrade[] = ['A', 'B', 'C', 'PENDING']
  if (grade && grade !== 'ALL' && VALID_GRADES.includes(grade as SecurityGrade)) {
    where.securityGrade = grade as SecurityGrade
  }

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
    sort === 'installs'
      ? { installCount: 'desc' }
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
  const [skills, categories] = await Promise.all([
    getSkills(searchParams),
    getCategories(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-black tracking-tight">浏览 Skills</h1>
        <p className="text-sm text-muted-foreground mt-1">共 {skills.length} 个已发布的 Skills</p>
      </div>

      <Suspense fallback={<div className="h-24 border border-border bg-[var(--hero-bg)] animate-pulse" />}>
        <SkillFilters categories={categories} />
      </Suspense>

      <div className="mt-6">
        {skills.length === 0 ? (
          <div className="border border-border p-16 text-center text-muted-foreground text-sm">
            没有找到匹配的 Skills
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {skills.map(skill => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
