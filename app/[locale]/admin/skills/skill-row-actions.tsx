'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
}

interface Skill {
  id: string
  title: string
  description: string
  status: string
  securityGrade: string
  content: string | null
  fileUrl: string | null
  categoryId: string
}

interface SkillRowActionsProps {
  skill: Skill
  categories: Category[]
}

export function SkillRowActions({ skill, categories }: SkillRowActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState(skill.title)
  const [editDesc, setEditDesc] = useState(skill.description)
  const [editCategoryId, setEditCategoryId] = useState(skill.categoryId)
  const [editFileUrl, setEditFileUrl] = useState(skill.fileUrl ?? '')
  const [editError, setEditError] = useState('')

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (newStatus === skill.status) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleGradeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newGrade = e.target.value
    if (newGrade === skill.securityGrade) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skill.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: newGrade }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个 Skill 吗？此操作不可撤销。')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skill.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTitle.trim()) { setEditError('标题不能为空'); return }
    if (!editDesc.trim()) { setEditError('描述不能为空'); return }
    setLoading(true)
    setEditError('')
    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          categoryId: editCategoryId,
          fileUrl: editFileUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? '保存失败'); return }
      setEditOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const selectCls = 'border border-gray-200 rounded px-2 py-1 text-xs bg-white'
  const inputCls = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <>
      <div className="flex items-center gap-1.5">
        <select value={skill.status} onChange={handleStatusChange} disabled={loading} className={selectCls}>
          <option value="PENDING">待审核</option>
          <option value="PUBLISHED">已发布</option>
          <option value="REJECTED">已拒绝</option>
        </select>
        <select value={skill.securityGrade} onChange={handleGradeChange} disabled={loading} className={selectCls}>
          <option value="PENDING">待评级</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
        </select>
        <button
          onClick={() => setEditOpen(true)}
          disabled={loading}
          className="text-xs border border-gray-200 rounded px-2 py-1 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          编辑
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs border border-red-200 rounded px-2 py-1 text-red-500 hover:bg-red-50 transition-colors"
        >
          删除
        </button>
      </div>

      {/* 编辑模态框 */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-base">编辑 Skill</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* 标题 */}
              <div>
                <label className={labelCls}>标题 *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  maxLength={80}
                  required
                  className={inputCls}
                />
              </div>

              {/* 描述 */}
              <div>
                <label className={labelCls}>描述 *</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1">{editDesc.length}/500</p>
              </div>

              {/* 分类 */}
              <div>
                <label className={labelCls}>分类 *</label>
                <select
                  value={editCategoryId}
                  onChange={e => setEditCategoryId(e.target.value)}
                  className={inputCls}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* GitHub URL */}
              <div>
                <label className={labelCls}>GitHub 仓库 URL</label>
                <input
                  type="url"
                  value={editFileUrl}
                  onChange={e => setEditFileUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>

              {editError && (
                <p className="text-sm text-red-500 border border-red-200 bg-red-50 rounded px-3 py-2">{editError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-gray-200 rounded py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
