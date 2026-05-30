import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { ProfileEditForm } from '@/components/profile-edit-form'
import { Calendar, BookOpen, Heart } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '审核中', color: 'border-yellow-400 text-yellow-600' },
  PUBLISHED: { label: '已发布', color: 'border-green-500 text-green-600' },
  REJECTED:  { label: '未通过', color: 'border-red-400 text-red-500' },
}

const ROLE_LABELS: Record<string, string> = {
  USER:        '普通用户',
  CONTRIBUTOR: '认证贡献者',
  ADMIN:       '管理员',
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user, mySkills, myFavorites] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true, name: true, email: true, role: true, bio: true, createdAt: true },
    }),
    db.skill.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { nickname: true } },
        category: true,
      },
    }),
    db.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        skill: {
          include: {
            author: { select: { nickname: true } },
            category: true,
          },
        },
      },
    }),
  ])

  if (!user) redirect('/login')

  const displayName = user.nickname ?? user.name ?? user.email

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ===== 个人信息卡 ===== */}
      <section className="border border-border p-8 mb-8 bg-[var(--hero-bg)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* 头像 */}
          <div className="w-20 h-20 bg-foreground text-background flex items-center justify-center text-3xl font-heading font-black border border-border flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-heading text-2xl font-black tracking-tight">{displayName}</h1>
              <span className="text-xs font-mono border border-border px-2 py-0.5 text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <p className="text-sm font-mono text-muted-foreground mb-2">{user.email}</p>
            {user.bio ? (
              <p className="text-sm text-muted-foreground max-w-lg mb-3">{user.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic mb-3">暂无个人简介</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* 编辑按钮 */}
          <ProfileEditForm initialNickname={user.nickname} initialBio={user.bio} />
        </div>
      </section>

      {/* ===== 统计 ===== */}
      <div className="grid grid-cols-2 gap-px bg-border border border-border mb-8">
        {[
          { value: mySkills.filter(s => s.status === 'PUBLISHED').length, label: '已发布', icon: BookOpen },
          { value: myFavorites.length, label: '我的收藏', icon: Heart },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="bg-card py-6 px-4 text-center">
            <Icon size={16} className="mx-auto mb-2 text-muted-foreground" />
            <div className="font-heading text-2xl font-black">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ===== 我的上传 ===== */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-black uppercase tracking-tight">
            我的上传
            <span className="text-muted-foreground font-mono text-sm ml-2 normal-case tracking-normal">
              ({mySkills.length})
            </span>
          </h2>
          <Link
            href="/submit"
            className="text-xs font-mono uppercase tracking-wider border border-border px-3 py-1.5 hover:border-brand hover:text-brand transition-colors"
          >
            + 上传新 Skill
          </Link>
        </div>

        {mySkills.length === 0 ? (
          <div className="border border-border p-12 text-center text-muted-foreground text-sm">
            还没有上传过 Skill
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {mySkills.map(skill => (
              <div key={skill.id} className="relative">
                <SkillCard skill={skill} />
                <span className={`absolute top-3 right-3 text-xs font-mono border px-2 py-0.5 bg-background ${STATUS_LABELS[skill.status].color}`}>
                  {STATUS_LABELS[skill.status].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== 我的收藏 ===== */}
      <section>
        <h2 className="font-heading text-lg font-black uppercase tracking-tight mb-4">
          我的收藏
          <span className="text-muted-foreground font-mono text-sm ml-2 normal-case tracking-normal">
            ({myFavorites.length})
          </span>
        </h2>

        {myFavorites.length === 0 ? (
          <div className="border border-border p-12 text-center text-muted-foreground text-sm">
            还没有收藏过 Skill
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {myFavorites.map(({ skill }) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
