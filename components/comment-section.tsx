'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
}

export function CommentSection({ skillId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/skills/${skillId}/comments`)
      .then(r => r.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setFetching(false))
  }, [skillId])

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
        setComments(prev => [comment, ...prev])
        setContent('')
        setRating(5)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h2 className="font-heading text-sm font-black uppercase tracking-tight">
          用户评价 {!fetching && `(${comments.length})`}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* 评价表单 */}
        {session && (
          <form onSubmit={handleSubmit} className="border border-border p-4 space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  size={18}
                  className={`cursor-pointer transition-colors ${
                    n <= rating ? 'fill-brand text-brand' : 'text-muted-foreground'
                  }`}
                  onClick={() => setRating(n)}
                />
              ))}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="分享你的使用体验..."
              className="w-full border border-border bg-transparent px-3 py-2 text-sm font-mono resize-none h-20 focus:outline-none focus:border-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-foreground text-background hover:bg-brand transition-colors disabled:opacity-50"
            >
              {loading ? '提交中...' : '发表评价'}
            </button>
          </form>
        )}

        {/* 评论列表 */}
        {fetching ? (
          <p className="text-sm text-muted-foreground text-center py-4">加载中...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            还没有评价，{session ? '发表第一条吧' : '登录后发表第一条吧'}
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{c.user.nickname}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        size={12}
                        className={n <= c.rating ? 'fill-brand text-brand' : 'text-muted-foreground'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
