import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '未通过', color: 'bg-red-100 text-red-700' },
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user, mySkills, myFavorites] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true, email: true, role: true, createdAt: true },
    }),
    db.skill.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { nickname: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        skill: {
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    }),
  ])

  if (!user) redirect('/login')

  const ROLE_LABELS: Record<string, string> = {
    USER: '普通用户',
    CONTRIBUTOR: '认证贡献者',
    ADMIN: '管理员',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 用户信息 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
          {user.nickname[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.nickname}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <Badge className="mt-1">{ROLE_LABELS[user.role]}</Badge>
        </div>
      </div>

      <Tabs defaultValue="uploads">
        <TabsList>
          <TabsTrigger value="uploads">我的上传（{mySkills.length}）</TabsTrigger>
          <TabsTrigger value="favorites">我的收藏（{myFavorites.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="mt-4">
          {mySkills.length === 0 ? (
            <p className="text-gray-400 text-center py-12">还没有上传过 Skill</p>
          ) : (
            <div className="space-y-3">
              {mySkills.map(skill => (
                <div key={skill.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <SkillCard skill={skill} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_LABELS[skill.status].color}`}>
                    {STATUS_LABELS[skill.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          {myFavorites.length === 0 ? (
            <p className="text-gray-400 text-center py-12">还没有收藏过 Skill</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myFavorites.map(({ skill }) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
