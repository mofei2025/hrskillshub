import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Download, Heart } from 'lucide-react'

const AI_LABELS: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  deepseek: 'DeepSeek',
  all: '通用',
}

const TYPE_LABELS: Record<string, string> = {
  PROMPT: '提示词',
  CLAUDE_SKILL: 'Claude Skill',
}

interface SkillCardProps {
  skill: {
    id: string
    title: string
    description: string
    type: string
    compatibleAi: string[]
    downloadCount: number
    favoriteCount: number
    author: { nickname: string }
    category: { name: string }
  }
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={`/skills/${skill.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{skill.title}</h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              {TYPE_LABELS[skill.type] ?? skill.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{skill.description}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="secondary" className="text-xs">{skill.category.name}</Badge>
            {skill.compatibleAi.map(ai => (
              <Badge key={ai} variant="outline" className="text-xs">
                {AI_LABELS[ai] ?? ai}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{skill.author.nickname}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {skill.downloadCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {skill.favoriteCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
