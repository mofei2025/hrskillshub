// app/skills/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { GradeBadge } from '@/components/grade-badge'
import { InstallTabs } from '@/components/install-tabs'
import { VersionHistory } from '@/components/version-history'
import { RelatedSkills } from '@/components/related-skills'
import { SecurityPanel } from '@/components/security-panel'
import { FavoriteButton } from '@/components/favorite-button'
import { CommentSection } from '@/components/comment-section'
import { Download, Star, User, ChevronRight, Tag } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const skill = await db.skill.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { id: true, nickname: true, avatarUrl: true } },
      _count: { select: { comments: true, favorites: true } },
    },
  })

  if (!skill) notFound()

  const [avgRatingResult, favRecord] = await Promise.all([
    db.comment.aggregate({
      where: { skillId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    session?.user?.id
      ? db.favorite.findUnique({
          where: { userId_skillId: { userId: session.user.id, skillId: id } },
        })
      : Promise.resolve(null),
  ])
  const userFavorited = !!favRecord

  const avgRating = avgRatingResult._avg.rating?.toFixed(1) ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
        <ChevronRight size={12} />
        <Link href="/skills" className="hover:text-foreground transition-colors">Skills</Link>
        <ChevronRight size={12} />
        <span className="text-foreground">{skill.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== 主栏 ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* 徽章行 */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/skills?category=${skill.category.slug}`}
              className="text-xs font-mono uppercase tracking-wider border border-border px-2 py-1 hover:border-brand hover:text-brand transition-colors"
            >
              {skill.category.name}
            </Link>
            <span className="text-xs font-mono border border-border px-2 py-1 text-muted-foreground">
              {skill.type === 'CLAUDE_SKILL' ? 'Claude Skill' : 'Prompt'}
            </span>
            <GradeBadge grade={skill.securityGrade} size="sm" />
            <span className="text-xs font-mono text-muted-foreground">
              v{skill.version}
            </span>
          </div>

          {/* 标题 + 描述 */}
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight mb-3">
              {skill.title}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {skill.description}
            </p>
          </div>

          {/* 统计行 */}
          <div className="flex items-center gap-6 text-sm border-y border-border py-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Download size={14} />
              {skill.installCount.toLocaleString()} 次安装
            </span>
            {avgRating && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star size={14} />
                {avgRating} / 5 ({avgRatingResult._count.rating} 条评价)
              </span>
            )}
            {session?.user?.id && (
              <FavoriteButton
                skillId={id}
                initialFavorited={userFavorited}
                favoriteCount={skill._count.favorites}
              />
            )}
          </div>

          {/* 安装方式 */}
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-tight mb-3">
              安装方式
            </h2>
            <InstallTabs
              skillId={id}
              content={skill.content}
              fileUrl={skill.fileUrl}
            />
          </div>

          {/* Skill 内容预览 */}
          {skill.content && (
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)] flex items-center justify-between">
                <h2 className="font-heading text-sm font-black uppercase tracking-tight">
                  内容预览
                </h2>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                {skill.content.slice(0, 1000)}
                {skill.content.length > 1000 && (
                  <span className="block mt-2 text-xs text-muted-foreground">
                    …（完整内容通过安装获取）
                  </span>
                )}
              </pre>
            </div>
          )}

          {/* 版本历史 */}
          <VersionHistory skillId={id} />

          {/* 评论 */}
          <CommentSection skillId={id} />
        </div>

        {/* ===== 侧栏 ===== */}
        <div className="space-y-4">
          {/* 作者信息 */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
              <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <User size={14} />
                作者
              </h3>
            </div>
            <div className="p-4">
              <Link
                href={`/authors/${skill.author.nickname}`}
                className="flex items-center gap-3 hover:text-brand transition-colors group"
              >
                <div className="w-10 h-10 bg-[var(--hero-bg)] border border-border flex items-center justify-center text-sm font-heading font-black">
                  {skill.author.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium group-hover:text-brand transition-colors">
                    {skill.author.nickname}
                  </div>
                  <div className="text-xs text-muted-foreground">查看主页 →</div>
                </div>
              </Link>
            </div>
          </div>

          {/* 安全评级 */}
          <SecurityPanel
            grade={skill.securityGrade}
            score={skill.securityScore}
            notes={skill.securityNotes}
          />

          {/* 兼容 AI */}
          {skill.compatibleAi.length > 0 && (
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
                <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
                  <Tag size={14} />
                  兼容 AI
                </h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {skill.compatibleAi.map((ai) => (
                  <span
                    key={ai}
                    className="text-xs font-mono border border-border px-2 py-1 text-muted-foreground"
                  >
                    {ai}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 相关推荐 */}
          <RelatedSkills skillId={id} categoryId={skill.categoryId} />
        </div>
      </div>
    </div>
  )
}
