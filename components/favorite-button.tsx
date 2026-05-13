'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  skillId: string
  initialCount: number
}

export function FavoriteButton({ skillId, initialCount }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!session) {
      router.push('/login')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/skills/${skillId}/favorite`, { method: 'POST' })
    if (!res.ok) {
      setLoading(false)
      return
    }
    const { favorited: newFavorited } = await res.json()
    setFavorited(newFavorited)
    setCount(c => newFavorited ? c + 1 : c - 1)
    setLoading(false)
  }

  return (
    <Button
      variant={favorited ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1 shrink-0"
    >
      <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
      {count}
    </Button>
  )
}
