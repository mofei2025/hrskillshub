'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface Props {
  categories: Category[]
}

const SORTS = [
  { label: '最新', value: '' },
  { label: '最多安装', value: 'installs' },
  { label: '最多收藏', value: 'favorites' },
]

const GRADES = [
  { value: '', label: '全部等级' },
  { value: 'S', label: 'S 级' },
  { value: 'A', label: 'A 级' },
  { value: 'B', label: 'B 级' },
  { value: 'C', label: 'C 级' },
  { value: 'D', label: 'D 级' },
]

export function SkillFilters({ categories }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current = {
    category: searchParams.get('category') ?? '',
    sort: searchParams.get('sort') ?? '',
    grade: searchParams.get('grade') ?? '',
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/skills?${params.toString()}`)
  }

  const btnBase = 'text-xs font-mono px-3 py-1 border transition-colors'
  const btnActive = 'border-brand text-brand bg-brand/5'
  const btnInactive = 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'

  return (
    <div className="border border-border bg-[var(--hero-bg)] p-4 space-y-4">
      {/* 场景分类 */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">场景分类</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`${btnBase} ${current.category === '' ? btnActive : btnInactive}`}
            onClick={() => setParam('category', '')}
          >
            全部
          </button>
          {categories.map(c => (
            <button
              key={c.slug}
              className={`${btnBase} ${current.category === c.slug ? btnActive : btnInactive}`}
              onClick={() => setParam('category', c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 安全等级 */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">安全等级</p>
          <div className="flex gap-1.5 flex-wrap">
            {GRADES.map(g => (
              <button
                key={g.value}
                className={`${btnBase} ${current.grade === g.value ? btnActive : btnInactive}`}
                onClick={() => setParam('grade', g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">排序</p>
          <div className="flex gap-1.5 flex-wrap">
            {SORTS.map(s => (
              <button
                key={s.value}
                className={`${btnBase} ${current.sort === s.value ? btnActive : btnInactive}`}
                onClick={() => setParam('sort', s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
