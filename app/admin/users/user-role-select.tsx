'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserRoleSelectProps {
  userId: string
  currentRole: string
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRoleChange(newRole: string | null) {
    if (!newRole) return
    if (newRole === currentRole) return
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={currentRole} onValueChange={handleRoleChange} disabled={loading}>
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USER">普通用户</SelectItem>
        <SelectItem value="CONTRIBUTOR">认证贡献者</SelectItem>
        <SelectItem value="ADMIN">管理员</SelectItem>
      </SelectContent>
    </Select>
  )
}
