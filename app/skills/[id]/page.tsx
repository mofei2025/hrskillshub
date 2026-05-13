import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InstallGuide } from '@/components/install-guide'
import { CommentSection } from '@/components/comment-section'
import { FavoriteButton } from '@/components/favorite-button'
import { Download, Heart } from 'lucide-react'

const AI_LABELS: Record<string, string> = {
  claude: 'Claude', chatgpt: 'ChatGPT', deepseek: 'DeepSeek', all: '通用',
}

async function getSkill(id: string) {
  return db.skill.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      author: { select: { nickname: true } },
      category: { select: { name: true } },
      comments: {
        include: { user: { select: { nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const skill = await getSkill(params.id)
  if (!skill) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{skill.title}</h1>
          <FavoriteButton skillId={skill.id} initialCount={skill.favoriteCount} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
          <span>{skill.author.nickname}</span>
          <span>·</span>
          <Badge variant="secondary">{skill.category.name}</Badge>
          {skill.compatibleAi.map(ai => (
            <Badge key={ai} variant="outline">{AI_LABELS[ai] ?? ai}</Badge>
          ))}
        </div>
        <p className="text-gray-600">{skill.description}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" />{skill.downloadCount} 次使用
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />{skill.favoriteCount} 次收藏
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      <InstallGuide
        skillId={skill.id}
        skillTitle={skill.title}
        content={skill.content}
        fileUrl={skill.fileUrl}
        type={skill.type}
      />

      {skill.content && (
        <>
          <Separator className="my-6" />
          <div>
            <h2 className="text-lg font-semibold mb-3">完整内容预览</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
              {skill.content}
            </div>
          </div>
        </>
      )}

      <Separator className="my-6" />

      <CommentSection
        skillId={skill.id}
        initialComments={skill.comments as any}
      />
    </div>
  )
}
