import Link from 'next/link'
import { db } from '@/lib/db'
import { GradeBadge } from './grade-badge'
import { Download } from 'lucide-react'

interface RelatedSkillsProps {
  skillId: string
  categoryId: string
}

export async function RelatedSkills({ skillId, categoryId }: RelatedSkillsProps) {
  const related = await db.skill.findMany({
    where: {
      categoryId,
      status: 'PUBLISHED',
      id: { not: skillId },
    },
    include: {
      category: true,
      author: { select: { nickname: true } },
    },
    orderBy: { installCount: 'desc' },
    take: 3,
  })

  if (related.length === 0) return null

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h3 className="font-heading text-sm font-black uppercase tracking-tight">相关 Skills</h3>
      </div>
      <div className="divide-y divide-border">
        {related.map((skill) => (
          <Link
            key={skill.id}
            href={`/skills/${skill.id}`}
            className="block px-4 py-3 hover:bg-[var(--hero-bg)] transition-colors group"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-sm font-medium group-hover:text-brand transition-colors line-clamp-2">
                {skill.title}
              </span>
              <GradeBadge grade={skill.securityGrade} size="sm" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Download size={10} />
              <span>{skill.installCount.toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
