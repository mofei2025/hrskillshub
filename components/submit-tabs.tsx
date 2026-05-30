'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AI_OPTIONS = [
  { label: 'Claude', value: 'claude' },
  { label: 'ChatGPT', value: 'chatgpt' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '通用', value: 'all' },
]

interface Category {
  id: string
  name: string
}

interface SubmitTabsProps {
  categories: Category[]
}

export function SubmitTabs({ categories }: SubmitTabsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    categoryId: '',
    type: 'PROMPT',
    compatibleAi: [] as string[],
  })

  function update(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleAi(value: string) {
    setForm(f => ({
      ...f,
      compatibleAi: f.compatibleAi.includes(value)
        ? f.compatibleAi.filter(v => v !== value)
        : [...f.compatibleAi, value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!form.title.trim() || !form.description.trim() || !form.content.trim() || !form.categoryId) {
      setMessage({ text: '请填写所有必填项', ok: false })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.skill?.status === 'PUBLISHED') {
          router.push(`/skills/${data.skill.id}`)
        } else {
          setMessage({ text: '✓ 提交成功！我们会尽快审核，通过后自动发布。', ok: true })
          setForm({ title: '', description: '', content: '', categoryId: '', type: 'PROMPT', compatibleAi: [] })
        }
      } else {
        setMessage({ text: data.error ?? '提交失败，请重试', ok: false })
      }
    } catch {
      setMessage({ text: '网络错误，请检查连接后重试', ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标题 */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Skill 名称 <span className="text-brand">*</span>
        </label>
        <input
          value={form.title}
          onChange={e => update('title', e.target.value)}
          placeholder="例如：JD 生成助手 · 招聘专员版"
          className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* 描述 */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          一句话描述 <span className="text-brand">*</span>
        </label>
        <input
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="这个 Skill 能解决什么问题？适合谁用？"
          className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* 分类 + 类型 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            分类 <span className="text-brand">*</span>
          </label>
          <select
            value={form.categoryId}
            onChange={e => update('categoryId', e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="">选择分类</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            类型
          </label>
          <div className="flex h-[50px]">
            {[
              { value: 'PROMPT', label: '提示词' },
              { value: 'CLAUDE_SKILL', label: 'Claude Skill' },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => update('type', t.value)}
                className={`flex-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
                  form.type === t.value
                    ? 'bg-brand text-white border-brand'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                } first:border-r-0`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 兼容 AI */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          兼容 AI <span className="text-muted-foreground font-normal normal-case">(可选)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AI_OPTIONS.map(ai => (
            <button
              key={ai.value}
              type="button"
              onClick={() => toggleAi(ai.value)}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                form.compatibleAi.includes(ai.value)
                  ? 'bg-brand text-white border-brand'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              {ai.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill 内容 */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Skill 内容 <span className="text-brand">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">粘贴你的完整提示词或 Skill 指令，支持 Markdown</p>
        <textarea
          value={form.content}
          onChange={e => update('content', e.target.value)}
          placeholder={'# 你的 Skill 名称\n\n## 使用方法\n\n粘贴提示词内容...'}
          rows={14}
          className="w-full bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-foreground transition-colors resize-y"
        />
      </div>

      {/* 状态消息 */}
      {message && (
        <div className={`text-sm px-4 py-3 border ${
          message.ok
            ? 'border-green-600 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400'
            : 'border-brand text-brand bg-red-50 dark:bg-red-950/30'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background py-4 text-sm font-mono uppercase tracking-wider hover:bg-brand hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '提交中...' : '提交 Skill →'}
      </button>

      <p className="text-xs text-muted-foreground text-center -mt-2">
        提交后进入审核队列，通过后自动公开发布
      </p>
    </form>
  )
}
