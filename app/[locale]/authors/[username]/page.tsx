import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { SkillCard } from '@/components/skill-card'
import { FollowButton } from '@/components/follow-button'
import { Download, Star, Users, BookOpen, Calendar, UserCheck } from 'lucide-react'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function AuthorPage({ params }: PageProps) {
  const { username } = await params
  const session = await auth()

  const user = await db.user.findFirst({
    where: { OR: [{ id: username }, { nickname: username }] },
    select: {
      id: true,
      nickname: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          skills: { where: { status: 'PUBLISHED' } },
          followedBy: true,
          following: true,
        },
      },
    },
  })

  if (!user) notFound()

  const [skills, installAgg, ratingAgg, followRecord] = await Promise.all([
    db.skill.findMany({
      where: { authorId: user.id, status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { nickname: true } },
      },
      orderBy: { installCount: 'desc' },
    }),
    db.skill.aggregate({
      where: { authorId: user.id, status: 'PUBLISHED' },
      _sum: { installCount: true },
    }),
    db.comment.aggregate({
      where: { skill: { authorId: user.id, status: 'PUBLISHED' } },
      _avg: { rating: true },
    }),
    session?.user?.id
      ? db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: user.id,
            },
          },
        })
      : Promise.resolve(null),
  ])

  const totalInstalls = installAgg._sum.installCount ?? 0
  const avgRating = ratingAgg._avg.rating?.toFixed(1) ?? null
  const isFollowing = !!followRecord
  const displayName = user.nickname ?? user.name ?? user.email

  const recentActivity = [...skills]
    .sort((a, b) => {
      const aDate = a.publishedAt ?? a.createdAt
      const bDate = b.publishedAt ?? b.createdAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ===== 英雄区 ===== */}
      <section className="border border-border p-8 mb-8 bg-[var(--hero-bg)]">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* 头像 */}
          <div className="w-20 h-20 border border-border flex-shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={displayName} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-foreground text-background flex items-center justify-center text-3xl font-heading font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-heading text-2xl font-black tracking-tight mb-1">
              {displayName}
            </h1>
            <p className="text-sm font-mono text-muted-foreground mb-2">@{user.id.slice(0, 8)}</p>
            {user.bio && (
              <p className="text-sm text-muted-foreground max-w-lg mb-3">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {session?.user?.id !== user.id && (
            <FollowButton
              targetUserId={user.id}
              initialFollowing={isFollowing}
              initialFollowerCount={user._count.followedBy}
              isLoggedIn={!!session?.user?.id}
            />
          )}
        </div>
      </section>

      {/* ===== 统计数字 ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border mb-8">
        {[
          { value: user._count.skills, label: '发布 Skills', icon: BookOpen },
          {
            value: totalInstalls >= 1000 ? `${(totalInstalls / 1000).toFixed(1)}k` : totalInstalls,
            label: '总安装量',
            icon: Download,
          },
          { value: avgRating ?? '--', label: '平均评分', icon: Star },
          { value: user._count.followedBy, label: '粉丝', icon: Users },
          { value: user._count.following, label: '关注中', icon: UserCheck },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="bg-card py-6 px-4 text-center">
            <Icon size={16} className="mx-auto mb-2 text-muted-foreground" />
            <div className="font-heading text-xl font-black">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ===== 主体 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 id="skills" className="font-heading text-lg font-black uppercase tracking-tight mb-4">
            发布的 Skills
          </h2>
          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="border border-border p-8 text-center text-muted-foreground text-sm">
              暂无已发布的 Skills
            </div>
          )}
        </div>
        <div>
          <h2 className="font-heading text-lg font-black uppercase tracking-tight mb-4">
            近期活动
          </h2>
          <div className="border border-border divide-y divide-border">
            {recentActivity.length > 0 ? (
              recentActivity.map((skill) => (
                <div key={skill.id} className="px-4 py-3">
                  <div className="text-xs text-muted-foreground mb-1">发布了新 Skill</div>
                  <Link
                    href={`/skills/${skill.id}`}
                    className="text-sm font-medium hover:text-brand transition-colors"
                  >
                    {skill.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(skill.publishedAt ?? skill.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                暂无活动记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
