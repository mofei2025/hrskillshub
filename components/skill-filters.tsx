'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  { label: '全部', value: '' },
  { label: '招聘', value: 'recruitment' },
  { label: '绩效管理', value: 'performance' },
  { label: '薪酬福利', value: 'compensation' },
  { label: '员工关系', value: 'employee-relations' },
  { label: '培训发展', value: 'training' },
  { label: '人力规划', value: 'planning' },
]

const TYPES = [
  { label: '全部类型', value: '' },
  { label: '提示词', value: 'prompt' },
  { label: 'Claude Skill', value: 'claude_skill' },
]

const AI_OPTIONS = [
  { label: '全部 AI', value: '' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'ChatGPT', value: 'chatgpt' },
  { label: 'Claude', value: 'claude' },
  { label: '通用', value: 'all' },
]

const SORTS = [
  { label: '最新', value: 'newest' },
  { label: '最多下载', value: 'downloads' },
  { label: '最多收藏', value: 'favorites' },
]

export function SkillFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/skills?${params.toString()}`)
  }

  const current = {
    category: searchParams.get('category') ?? '',
    type: searchParams.get('type') ?? '',
    ai: searchParams.get('ai') ?? '',
    sort: searchParams.get('sort') ?? 'newest',
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 mb-1">场景分类</p>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(c => (
            <Button
              key={c.value}
              size="sm"
              variant={current.category === c.value ? 'default' : 'outline'}
              onClick={() => setParam('category', c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1">类型</p>
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <Button
              key={t.value}
              size="sm"
              variant={current.type === t.value ? 'default' : 'outline'}
              onClick={() => setParam('type', t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1">兼容 AI</p>
        <div className="flex flex-wrap gap-1">
          {AI_OPTIONS.map(a => (
            <Button
              key={a.value}
              size="sm"
              variant={current.ai === a.value ? 'default' : 'outline'}
              onClick={() => setParam('ai', a.value)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1">排序</p>
        <div className="flex flex-wrap gap-1">
          {SORTS.map(s => (
            <Button
              key={s.value}
              size="sm"
              variant={current.sort === s.value ? 'default' : 'outline'}
              onClick={() => setParam('sort', s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
