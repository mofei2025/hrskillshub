'use client'

import { useState, useEffect, useCallback } from 'react'

const PERIODS = [
  { label: '今天', value: 'today' },
  { label: '24小时', value: '24h' },
  { label: '本周', value: 'week' },
  { label: '7天', value: '7d' },
  { label: '本月', value: 'month' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
  { label: '今年', value: 'year' },
  { label: '6个月', value: '6m' },
  { label: '12个月', value: '12m' },
  { label: '所有', value: 'all' },
  { label: '自定义', value: 'custom' },
]

function getRange(period: string): { startAt: number; endAt: number } {
  const now = Date.now()
  const d = new Date()

  switch (period) {
    case 'today': {
      const start = new Date(d); start.setHours(0, 0, 0, 0)
      return { startAt: start.getTime(), endAt: now }
    }
    case '24h':
      return { startAt: now - 24 * 3600 * 1000, endAt: now }
    case 'week': {
      const start = new Date(d)
      start.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
      start.setHours(0, 0, 0, 0)
      return { startAt: start.getTime(), endAt: now }
    }
    case '7d':
      return { startAt: now - 7 * 24 * 3600 * 1000, endAt: now }
    case 'month': {
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      return { startAt: start.getTime(), endAt: now }
    }
    case '30d':
      return { startAt: now - 30 * 24 * 3600 * 1000, endAt: now }
    case '90d':
      return { startAt: now - 90 * 24 * 3600 * 1000, endAt: now }
    case 'year': {
      const start = new Date(d.getFullYear(), 0, 1)
      return { startAt: start.getTime(), endAt: now }
    }
    case '6m':
      return { startAt: now - 180 * 24 * 3600 * 1000, endAt: now }
    case '12m':
      return { startAt: now - 365 * 24 * 3600 * 1000, endAt: now }
    case 'all':
      return { startAt: new Date('2024-01-01').getTime(), endAt: now }
    default:
      return { startAt: now - 24 * 3600 * 1000, endAt: now }
  }
}

interface UmamiData {
  active: { visitors: number } | null
  stats: {
    pageviews: { value: number }
    visitors: { value: number }
    bounces: { value: number }
    visits: { value: number }
    totaltime: { value: number }
  } | null
  pages: { x: string; y: number }[] | null
  referrers: { x: string; y: number }[] | null
  browsers: { x: string; y: number }[] | null
  devices: { x: string; y: number }[] | null
}

export function AdminUmamiStats() {
  const [period, setPeriod] = useState('24h')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<UmamiData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: string, cs?: string, ce?: string) => {
    setLoading(true)
    try {
      let startAt: number, endAt: number
      if (p === 'custom' && cs && ce) {
        startAt = new Date(cs).getTime()
        endAt = new Date(ce + 'T23:59:59').getTime()
      } else {
        const range = getRange(p)
        startAt = range.startAt
        endAt = range.endAt
      }
      const res = await fetch(`/api/admin/umami?startAt=${startAt}&endAt=${endAt}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (period !== 'custom') fetchData(period)
  }, [period, fetchData])

  const handleCustomApply = () => {
    if (customStart && customEnd) fetchData('custom', customStart, customEnd)
  }

  const activeVisitors = data?.active?.visitors ?? 0
  const pageviews = data?.stats?.pageviews?.value ?? 0
  const visitors = data?.stats?.visitors?.value ?? 0
  const bounceRate = data?.stats?.bounces?.value != null && data?.stats?.visits?.value
    ? Math.round((data.stats.bounces.value / data.stats.visits.value) * 100)
    : null
  const avgDuration = data?.stats?.totaltime?.value != null && data?.stats?.visits?.value
    ? Math.round(data.stats.totaltime.value / data.stats.visits.value)
    : null

  const btnBase = 'text-xs font-mono px-2.5 py-1 border transition-colors'
  const btnActive = 'border-brand text-brand bg-brand/5'
  const btnInactive = 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'

  return (
    <section>
      {/* 标题栏 + 筛选 */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">访客数据</h2>
          <span className="flex items-center gap-1.5 text-xs font-mono text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            {activeVisitors} 人在线
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`${btnBase} ${period === p.value ? btnActive : btnInactive}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义时间段 */}
      {period === 'custom' && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="border border-border bg-card px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand"
          />
          <span className="text-xs text-muted-foreground font-mono">—</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="border border-border bg-card px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="border border-foreground px-4 py-1.5 text-xs font-mono hover:bg-brand hover:text-white hover:border-brand transition-colors disabled:opacity-40"
          >
            查询
          </button>
        </div>
      )}

      {/* 核心指标 */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border transition-opacity ${loading ? 'opacity-50' : ''}`}>
        {[
          { label: '页面浏览量', value: loading ? '…' : pageviews.toLocaleString(), sub: 'PV' },
          { label: '独立访客', value: loading ? '…' : visitors.toLocaleString(), sub: 'UV' },
          { label: '跳出率', value: loading ? '…' : bounceRate !== null ? `${bounceRate}%` : '-', sub: '单页即离开' },
          { label: '平均访问时长', value: loading ? '…' : avgDuration !== null ? `${avgDuration}s` : '-', sub: '每次会话' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
            <p className="font-heading text-4xl font-black text-foreground">{value}</p>
            <p className="text-xs mt-2 font-mono text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* 热门页面 + 来源 */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">热门页面</p>
          <div className="space-y-2.5">
            {!loading && (data?.pages ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground font-mono">暂无数据</p>
            )}
            {(data?.pages ?? []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{p.x || '/'}</span>
                <span className="font-mono text-xs text-brand font-medium">{p.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">访客来源</p>
          <div className="space-y-2.5">
            {!loading && (data?.referrers ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground font-mono">暂无数据（主要来自直接访问）</p>
            )}
            {(data?.referrers ?? []).map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{r.x || '直接访问'}</span>
                <span className="font-mono text-xs text-brand font-medium">{r.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 浏览器 + 设备 */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">浏览器</p>
          <div className="space-y-2.5">
            {!loading && (data?.browsers ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground font-mono">暂无数据</p>
            )}
            {(data?.browsers ?? []).map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs text-foreground font-mono flex-1">{b.x || '未知'}</span>
                <span className="font-mono text-xs text-brand font-medium">{b.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">设备类型</p>
          <div className="space-y-2.5">
            {!loading && (data?.devices ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground font-mono">暂无数据</p>
            )}
            {(data?.devices ?? []).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs text-foreground font-mono flex-1">{d.x || '未知'}</span>
                <span className="font-mono text-xs text-brand font-medium">{d.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
