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
import { FollowButton } from '@/components/follow-button'
import { Download, Star, User, ChevronRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const skill = await db.skill.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      categories: { orderBy: { order: 'asc' } },
      author: {
        select: {
          id: true,
          nickname: true,
          name: true,
          email: true,
          avatarUrl: true,
          _count: { select: { followedBy: true } },
        },
      },
      _count: { select: { comments: true, favorites: true } },
    },
  })

  if (!skill) notFound()

  const [avgRatingResult, favRecord, authorFollowRecord] = await Promise.all([
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
    session?.user?.id
      ? db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: skill.author.id,
            },
          },
        })
      : Promise.resolve(null),
  ])
  const userFavorited = !!favRecord
  const isAuthorFollowing = !!authorFollowRecord

  const avgRating = avgRatingResult._avg.rating?.toFixed(1) ?? null

  // 从 GitHub URL 或 id 推导 skill 目录名
  const fileUrl = skill.fileUrl
  function deriveSkillName(): string {
    if (!fileUrl) return id.slice(0, 12)
    try {
      const parts = new URL(fileUrl).pathname.split('/').filter(Boolean)
      return parts[parts.length - 1] ?? id.slice(0, 12)
    } catch {
      return id.slice(0, 12)
    }
  }
  const skillName = deriveSkillName()
  const categoryIds = skill.categories.map((c) => c.id)

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
            {skill.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/skills?category=${cat.slug}`}
                className="text-xs font-mono uppercase tracking-wider border border-border px-2 py-1 hover:border-brand hover:text-brand transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <span className="text-xs font-mono border border-border px-2 py-1 text-muted-foreground">
              Skill
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
              下载 / 安装
            </h2>
            <InstallTabs
              skillId={id}
              slug={skillName}
              fileUrl={skill.fileUrl}
            />
          </div>

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
            <div className="p-4 space-y-3">
              <Link
                href={`/authors/${skill.author.nickname ?? skill.author.id}`}
                className="flex items-center gap-3 hover:text-brand transition-colors group"
              >
                {skill.author.avatarUrl ? (
                  <img
                    src={skill.author.avatarUrl}
                    alt={skill.author.nickname ?? '作者'}
                    className="w-10 h-10 border border-border object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[var(--hero-bg)] border border-border flex items-center justify-center text-sm font-heading font-black flex-shrink-0">
                    {(skill.author.nickname ?? skill.author.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium group-hover:text-brand transition-colors">
                    {skill.author.nickname ?? skill.author.email}
                  </div>
                  <div className="text-xs text-muted-foreground">查看主页 →</div>
                </div>
              </Link>
              {session?.user?.id !== skill.author.id && (
                <FollowButton
                  targetUserId={skill.author.id}
                  initialFollowing={isAuthorFollowing}
                  initialFollowerCount={skill.author._count.followedBy}
                  isLoggedIn={!!session?.user?.id}
                />
              )}
            </div>
          </div>

          {/* 安全评级 */}
          <SecurityPanel
            grade={skill.securityGrade}
            score={skill.securityScore}
            notes={skill.securityNotes}
          />

          {/* 相关推荐 */}
          <RelatedSkills skillId={id} categoryIds={categoryIds} />
        </div>
      </div>
    </div>
  )
}
