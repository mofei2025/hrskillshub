'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
}

interface Props {
  categories: Category[]
}

export function SubmitTabs({ categories }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryIds: [] as string[],
    type: 'CLAUDE_SKILL' as const,
    githubUrl: '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function toggleCategory(id: string) {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || form.categoryIds.length === 0) {
      setError('请填写标题、描述并至少选择一个分类')
      return
    }
    if (!form.githubUrl.trim()) {
      setError('请提供 GitHub 仓库 URL')
      return
    }
    if (form.githubUrl && !/^https?:\/\/(www\.)?github\.com\/.+/.test(form.githubUrl.trim())) {
      setError('请输入有效的 GitHub 仓库链接（以 https://github.com/ 开头）')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          categoryIds: form.categoryIds,
          type: form.type,
          fileUrl: form.githubUrl.trim() || undefined,
          compatibleAi: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '提交失败，请重试')
        return
      }
      router.push(`/skills/${data.skill?.id ?? ''}`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-brand transition-colors'
  const labelCls = 'block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标题 */}
      <div>
        <label className={labelCls}>标题 *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="用一句话说明这个 Skill 能做什么"
          maxLength={80}
          className={inputCls}
          required
        />
      </div>

      {/* 描述 */}
      <div>
        <label className={labelCls}>描述 *</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="详细说明使用场景、效果和注意事项..."
          rows={3}
          maxLength={500}
          className={`${inputCls} resize-none`}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">{form.description.length}/500</p>
      </div>

      {/* 分类（多选） */}
      <div>
        <label className={labelCls}>分类 * <span className="text-muted-foreground normal-case">(可多选)</span></label>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => {
            const checked = form.categoryIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`text-sm border px-3 py-1.5 transition-colors ${
                  checked
                    ? 'border-brand bg-brand text-white'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
        {form.categoryIds.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">请至少选择一个分类</p>
        )}
      </div>

      {/* GitHub URL */}
      <div>
        <label className={labelCls}>
          GitHub 仓库 URL *
        </label>
        <input
          type="url"
          value={form.githubUrl}
          onChange={e => set('githubUrl', e.target.value)}
          placeholder="https://github.com/username/repo"
          className={`${inputCls} font-mono text-xs`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          指向包含此 Skill 文件的 GitHub 仓库或具体文件路径
        </p>
      </div>

      {/* 错误 */}
      {error && (
        <p className="text-sm text-red-500 border border-red-200 bg-red-50 px-3 py-2">{error}</p>
      )}

      {/* 提交 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand text-white py-3 font-heading font-black uppercase tracking-wider hover:bg-brand/90 transition-colors disabled:opacity-50"
      >
        {loading ? '提交中...' : '提交 Skill'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        提交后将进入审核队列，审核通过后公开展示
      </p>
    </form>
  )
}
