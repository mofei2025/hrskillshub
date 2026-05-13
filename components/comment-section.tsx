'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'

interface Comment {
  id: string
  content: string
  rating: number
  createdAt: string
  user: { nickname: string }
}

interface CommentSectionProps {
  skillId: string
  initialComments: Comment[]
}

export function CommentSection({ skillId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, content, rating }),
      })

      if (res.ok) {
        const { comment } = await res.json()
        setComments([comment, ...comments])
        setContent('')
        setRating(5)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">用户评价（{comments.length}）</h2>

      {session && (
        <form onSubmit={handleSubmit} className="mb-6 border rounded-lg p-4">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                className={`h-5 w-5 cursor-pointer ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(n)}
              />
            ))}
          </div>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="分享你的使用体验..."
            className="mb-2"
            required
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? '提交中...' : '发表评价'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">还没有评价，登录后发表第一条吧</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{c.user.nickname}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`h-3 w-3 ${n <= c.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
