import Link from 'next/link'
import { Download, User } from 'lucide-react'
import { GradeBadge } from './grade-badge'
import type { Skill, Category, User as PrismaUser } from '@prisma/client'

type SkillWithRelations = Skill & {
  categories: Pick<Category, 'name' | 'slug'>[]
  author: Pick<PrismaUser, 'nickname'>
}

interface SkillCardProps {
  skill: SkillWithRelations
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={`/skills/${skill.id}`} className="group block overflow-hidden">
      <article className="relative border border-[var(--card-border)] bg-card h-full hover:border-foreground transition-colors duration-150">
        {/* Grade 徽章 - 右上角 */}
        <div className="absolute top-3 right-3 z-10">
          <GradeBadge grade={skill.securityGrade} size="sm" />
        </div>

        <div className="p-4 pb-10 h-full flex flex-col">
          {/* 分类标签 */}
          <div className="mb-2 flex flex-wrap gap-1">
            {skill.categories.map((c) => (
              <span key={c.slug} className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {c.name}
              </span>
            ))}
          </div>

          {/* 标题 */}
          <h3 className="font-heading text-base font-black leading-tight mb-2 group-hover:text-brand transition-colors pr-20">
            {skill.title}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
            {skill.description}
          </p>

          {/* 底部：作者 + 统计 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User size={12} />
              {skill.author.nickname}
            </span>
            <span className="flex items-center gap-1">
              <Download size={12} />
              {skill.installCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Hover 安装按钮 */}
        <div className="absolute bottom-0 left-0 right-0 bg-brand text-white text-xs font-medium text-center py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-150">
          安装 →
        </div>
      </article>
    </Link>
  )
}
