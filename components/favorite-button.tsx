'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  skillId: string
  initialFavorited: boolean
  favoriteCount: number
}

export function FavoriteButton({ skillId, initialFavorited, favoriteCount }: FavoriteButtonProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [count, setCount] = useState(favoriteCount)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/skills/${skillId}/favorite`, { method: 'POST' })
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        return
      }
      const data = await res.json()
      setFavorited(data.favorited)
      setCount(data.count ?? (data.favorited ? count + 1 : count - 1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
        favorited ? 'text-brand' : 'text-muted-foreground hover:text-brand'
      }`}
    >
      <Heart size={14} className={favorited ? 'fill-current' : ''} />
      {count} 收藏
    </button>
  )
}
