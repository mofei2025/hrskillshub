'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  name: string
  slug: string
  _count: { skills: number }
}

export function CategoryActions({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!slug) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '添加失败')
        return
      }
      setName('')
      setSlug('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, skillCount: number) {
    if (skillCount > 0) {
      alert(`该分类下还有 ${skillCount} 个 Skill，无法删除`)
      return
    }
    if (!confirm('确定要删除这个分类吗？')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '删除失败')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">新增分类</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>分类名称</Label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="例如：招聘管理"
              required
            />
          </div>
          <div>
            <Label>Slug（URL 标识）</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="例如：recruitment"
              required
              pattern="[a-z0-9-]+"
              title="只允许小写字母、数字和连字符"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} size="sm">
          {loading ? '添加中...' : '添加分类'}
        </Button>
      </form>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">Skill 数</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500 text-center">{cat._count.skills}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cat.id, cat._count.skills)}
                    disabled={loading || cat._count.skills > 0}
                    title={cat._count.skills > 0 ? '有 Skill 时无法删除' : '删除分类'}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
