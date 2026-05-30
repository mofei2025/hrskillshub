'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SkillRowActionsProps {
  skillId: string
  currentStatus: string
  initialGrade?: string
}

export function SkillRowActions({ skillId, currentStatus, initialGrade = 'PENDING' }: SkillRowActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [grade, setGrade] = useState(initialGrade)

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return
    if (newStatus === currentStatus) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleGradeChange(newGrade: string | null) {
    if (!newGrade) return
    if (newGrade === grade) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/skills/${skillId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: newGrade }),
      })
      if (res.ok) {
        setGrade(newGrade)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个 Skill 吗？此操作不可撤销。')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skillId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">待审核</SelectItem>
          <SelectItem value="PUBLISHED">已发布</SelectItem>
          <SelectItem value="REJECTED">已拒绝</SelectItem>
        </SelectContent>
      </Select>
      <Select value={grade} onValueChange={handleGradeChange} disabled={loading}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">待评级</SelectItem>
          <SelectItem value="A">S 级</SelectItem>
          <SelectItem value="B">A 级</SelectItem>
          <SelectItem value="C">B 级</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
        删除
      </Button>
    </div>
  )
}
