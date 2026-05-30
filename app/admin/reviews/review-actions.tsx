'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const TYPE_LABELS: Record<string, string> = {
  PROMPT: 'Skill',
  CLAUDE_SKILL: 'Skill',
}

interface Skill {
  id: string
  title: string
  description: string
  type: string
  createdAt: Date
  author: { nickname: string | null; email: string }
  categories: { name: string }[]
}

export function ReviewActions({ skill }: { skill: Skill }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function handleAction(action: 'APPROVED' | 'REJECTED') {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: feedback || undefined }),
      })
      if (res.ok) {
        setRejectOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-semibold text-gray-900 truncate">{skill.title}</h2>
            <Badge variant="outline" className="text-xs shrink-0">
              {TYPE_LABELS[skill.type] ?? skill.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mb-1">{skill.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>作者：{skill.author.nickname}（{skill.author.email}）</span>
            <span>分类：{skill.categories.map((c: {name: string}) => c.name).join('、')}</span>
            <span>提交：{new Date(skill.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => handleAction('APPROVED')} disabled={loading}>
            通过
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setRejectOpen(true)} disabled={loading}>
            拒绝
          </Button>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝理由（选填）</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="请输入拒绝理由，提交者将看到此说明..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => handleAction('REJECTED')} disabled={loading}>
              {loading ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
