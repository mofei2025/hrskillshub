'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  targetUserId: string
  initialFollowing: boolean
  initialFollowerCount: number
  isLoggedIn: boolean
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowerCount,
  isLoggedIn,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFollow() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error('请求失败')
      const data = await res.json()
      setFollowing(data.following)
      setFollowerCount(data.followerCount)
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium border transition-colors ${
        following
          ? 'border-brand text-brand hover:bg-brand hover:text-white'
          : 'border-foreground bg-foreground text-background hover:bg-brand hover:border-brand'
      } disabled:opacity-50`}
    >
      {loading ? '…' : following ? `已关注 (${followerCount})` : `关注 (${followerCount})`}
    </button>
  )
}
