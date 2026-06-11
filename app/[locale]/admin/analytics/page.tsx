'use client'

import { useState, useEffect, useCallback } from 'react'

const PERIODS = [
  { label: '7天', value: '7d', days: 7 },
  { label: '14天', value: '14d', days: 14 },
  { label: '30天', value: '30d', days: 30 },
  { label: '90天', value: '90d', days: 90 },
  { label: '自定义', value: 'custom', days: 0 },
]

function getRange(days: number) {
  const end = Date.now()
  const start = end - days * 86400000
  return { startAt: start, endAt: end }
}

interface DailyRow { date: string; dau: number; pv: number }
interface WeeklyRow { week: string; wau: number; pv: number }
interface DauData {
  daily: DailyRow[]
  weekly: WeeklyRow[]
  avgDau: number
  peakDau: number
  totalPv: number
}

function BarChart({ items, valueKey }: {
  items: { label: string; value: number }[]
  valueKey: string
}) {
  if (!items.length) return <p className="text-xs text-muted-foreground font-mono py-4">暂无数据</p>
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div className="flex h-24 mt-3 gap-px">
      {items.map((item, i) => {
        const h = Math.max((item.value / max) * 100, 2)
        return (
          <div key={i} className="flex-1 relative group">
            <div
              className="absolute bottom-0 w-full bg-brand/50 hover:bg-brand transition-colors cursor-default"
              style={{ height: `${h}%` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex
              bg-foreground text-background text-xs font-mono px-1.5 py-0.5 whitespace-nowrap z-10 flex-col items-center">
              <span>{item.label}</span>
              <span className="font-bold">{valueKey}: {item.value}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<DauData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: string, cs?: string, ce?: string) => {
    setLoading(true)
    try {
      let startAt: number, endAt: number
      if (p === 'custom' && cs && ce) {
        startAt = new Date(cs).getTime()
        endAt = new Date(ce + 'T23:59:59').getTime()
      } else {
        const days = PERIODS.find(x => x.value === p)?.days ?? 30
        const range = getRange(days)
        startAt = range.startAt
        endAt = range.endAt
      }
      const res = await fetch(`/api/admin/analytics/dau?startAt=${startAt}&endAt=${endAt}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (period !== 'custom') fetchData(period)
  }, [period, fetchData])

  const btnBase = 'text-xs font-mono px-2.5 py-1 border transition-colors'
  const btnActive = 'border-brand text-brand bg-brand/5'
  const btnInactive = 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
  const fade = loading ? 'opacity-50' : ''

  const dailyItems = (data?.daily ?? []).map(d => ({ label: d.date.slice(5), value: d.dau }))
  const weeklyItems = (data?.weekly ?? []).map(w => ({ label: w.week.slice(5), value: w.wau }))

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="border-b border-border pb-6">
        <h1 className="font-heading text-2xl font-black tracking-tight uppercase">活跃用户趋势</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          DAU / WAU 历史查询
        </p>
      </div>

      {/* 时间段选择 */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`${btnBase} ${period === p.value ? btnActive : btnInactive}`}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="border border-border bg-card px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand" />
            <span className="text-xs font-mono text-muted-foreground">—</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="border border-border bg-card px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand" />
            <button
              onClick={() => { if (customStart && customEnd) fetchData('custom', customStart, customEnd) }}
              disabled={!customStart || !customEnd}
              className="border border-foreground px-4 py-1.5 text-xs font-mono hover:bg-brand hover:text-white hover:border-brand transition-colors disabled:opacity-40">
              查询
            </button>
          </>
        )}
      </div>

      {/* 摘要数字 */}
      <div className={`grid grid-cols-3 gap-px bg-border border border-border transition-opacity ${fade}`}>
        {[
          { label: '日均 DAU', value: data?.avgDau ?? 0, sub: '日活跃用户平均值' },
          { label: '峰值 DAU', value: data?.peakDau ?? 0, sub: '单日最高活跃' },
          { label: '总 PV', value: (data?.totalPv ?? 0).toLocaleString(), sub: '周期内总浏览量' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
            <p className="font-heading text-4xl font-black text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-xs mt-2 font-mono text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* 每日 DAU 图表 */}
      <div className={`border border-border bg-card p-6 transition-opacity ${fade}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">每日活跃用户（DAU）</p>
          <p className="text-xs font-mono text-muted-foreground">鼠标悬停查看详细数值</p>
        </div>
        <BarChart items={dailyItems} valueKey="DAU" />
        {/* X 轴标签（首尾） */}
        {dailyItems.length > 1 && (
          <div className="flex justify-between mt-1">
            <span className="text-xs font-mono text-muted-foreground">{dailyItems[0]?.label}</span>
            <span className="text-xs font-mono text-muted-foreground">{dailyItems[dailyItems.length - 1]?.label}</span>
          </div>
        )}
      </div>

      {/* 每周 WAU 图表 */}
      <div className={`border border-border bg-card p-6 transition-opacity ${fade}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">每周活跃用户（WAU）</p>
          <p className="text-xs font-mono text-muted-foreground">以周为粒度聚合</p>
        </div>
        <BarChart items={weeklyItems} valueKey="WAU" />
        {weeklyItems.length > 1 && (
          <div className="flex justify-between mt-1">
            <span className="text-xs font-mono text-muted-foreground">第 {weeklyItems[0]?.label} 周</span>
            <span className="text-xs font-mono text-muted-foreground">第 {weeklyItems[weeklyItems.length - 1]?.label} 周</span>
          </div>
        )}
      </div>

      {/* 详细数据表 */}
      <div className={`border border-border bg-card overflow-hidden transition-opacity ${fade}`}>
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">每日明细</p>
        </div>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-[var(--hero-bg)] border-b border-border sticky top-0">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">日期</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">DAU</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">PV</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">人均 PV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.daily ?? []).slice().reverse().map(row => (
                <tr key={row.date} className="hover:bg-[var(--hero-bg)] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{row.date}</td>
                  <td className="px-5 py-3 font-mono text-sm font-medium text-brand text-right">{row.dau.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground text-right">{row.pv.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground text-right">
                    {row.dau ? (row.pv / row.dau).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
              {!loading && (data?.daily ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs font-mono text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
