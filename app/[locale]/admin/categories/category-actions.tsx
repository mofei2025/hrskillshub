'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
  order: number
  _count: { skills: number }
}

export function CategoryActions({ categories: initial }: { categories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

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
      if (!res.ok) { setError(data.error ?? '添加失败'); return }
      setName(''); setSlug('')
      setCategories(prev => [...prev, { ...data.category, _count: { skills: 0 } }])
      router.refresh()
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string, skillCount: number) {
    if (skillCount > 0) { alert(`该分类下还有 ${skillCount} 个 Skill，无法删除`); return }
    if (!confirm('确定要删除这个分类吗？')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? '删除失败'); return }
      setCategories(prev => prev.filter(c => c.id !== id))
      router.refresh()
    } finally { setLoading(false) }
  }

  async function handleEdit(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, slug: editSlug }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? '更新失败'); return }
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName, slug: editSlug } : c))
      setEditId(null)
      router.refresh()
    } finally { setLoading(false) }
  }

  function handleDragStart(idx: number) {
    dragIdx.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOver(idx)
  }

  function handleDragLeave() {
    setDragOver(null)
  }

  async function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault()
    setDragOver(null)
    const fromIdx = dragIdx.current
    if (fromIdx === null || fromIdx === dropIdx) return
    dragIdx.current = null

    const next = [...categories]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(dropIdx, 0, moved)

    const updates = next.map((c, i) => ({ id: c.id, order: i }))
    setCategories(next.map((c, i) => ({ ...c, order: i })))

    await Promise.all(
      updates.map(u =>
        fetch(`/api/admin/categories/${u.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: u.order }),
        })
      )
    )
    router.refresh()
  }

  function handleDragEnd() {
    dragIdx.current = null
    setDragOver(null)
  }

  const inputCls = 'border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:border-brand transition-colors w-full'

  return (
    <div className="space-y-6">
      {/* 新增 */}
      <form onSubmit={handleAdd} className="border border-border p-5 bg-[var(--hero-bg)]">
        <h2 className="font-heading text-sm font-black uppercase tracking-tight mb-4">新增分类</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">名称</label>
            <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="例：招聘管理" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="例：recruitment" required pattern="[a-z0-9-]+" className={inputCls} />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <button type="submit" disabled={loading} className="bg-brand text-white text-xs font-mono uppercase px-4 py-1.5 hover:bg-brand/90 disabled:opacity-50 transition-colors">
          {loading ? '添加中...' : '添加分类'}
        </button>
      </form>

      {/* 列表 */}
      <div className="border border-border divide-y divide-border">
        <div className="grid grid-cols-12 bg-[var(--hero-bg)] px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span className="col-span-1">序</span>
          <span className="col-span-4">名称</span>
          <span className="col-span-4">Slug</span>
          <span className="col-span-1 text-center">数量</span>
          <span className="col-span-2 text-right">操作</span>
        </div>

        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className={`px-4 py-3 transition-colors ${dragOver === idx ? 'bg-brand/5 border-l-2 border-brand' : ''}`}
            draggable={editId !== cat.id}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
          >
            {editId === cat.id ? (
              /* 编辑行 */
              <div className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-xs text-muted-foreground font-mono">{idx + 1}</span>
                <div className="col-span-4">
                  <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-3">
                  <input value={editSlug} onChange={e => setEditSlug(e.target.value)} className={inputCls} pattern="[a-z0-9-]+" />
                </div>
                <span className="col-span-1 text-center text-sm text-muted-foreground">{cat._count.skills}</span>
                <div className="col-span-3 flex gap-1 justify-end">
                  <button onClick={() => handleEdit(cat.id)} disabled={loading} className="text-xs border border-brand text-brand px-2 py-1 hover:bg-brand hover:text-white transition-colors">保存</button>
                  <button onClick={() => setEditId(null)} className="text-xs border border-border px-2 py-1 hover:bg-[var(--hero-bg)] transition-colors">取消</button>
                </div>
              </div>
            ) : (
              /* 展示行 */
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-1 flex items-center justify-center cursor-grab active:cursor-grabbing" title="拖拽排序">
                  <span className="text-muted-foreground text-sm select-none">⠿</span>
                </div>
                <span className="col-span-4 text-sm font-medium">{cat.name}</span>
                <span className="col-span-4 text-xs font-mono text-muted-foreground">{cat.slug}</span>
                <span className="col-span-1 text-center text-sm text-muted-foreground">{cat._count.skills}</span>
                <div className="col-span-2 flex gap-1 justify-end">
                  <button
                    onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditSlug(cat.slug) }}
                    className="text-xs border border-border px-2 py-1 hover:border-foreground transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat._count.skills)}
                    disabled={loading || cat._count.skills > 0}
                    title={cat._count.skills > 0 ? '有 Skill 时无法删除' : '删除'}
                    className="text-xs border border-border px-2 py-1 text-red-500 border-red-200 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
