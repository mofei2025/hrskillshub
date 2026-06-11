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
  { label: '所有', value: 'all' },
  { label: '自定义', value: 'custom' },
]

function getRange(period: string): { startAt: number; endAt: number } {
  const now = Date.now()
  const d = new Date()
  switch (period) {
    case 'today': { const s = new Date(d); s.setHours(0,0,0,0); return { startAt: s.getTime(), endAt: now } }
    case '24h': return { startAt: now - 86400000, endAt: now }
    case 'week': { const s = new Date(d); s.setDate(d.getDate()-d.getDay()+(d.getDay()===0?-6:1)); s.setHours(0,0,0,0); return { startAt: s.getTime(), endAt: now } }
    case '7d': return { startAt: now - 7*86400000, endAt: now }
    case 'month': return { startAt: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), endAt: now }
    case '30d': return { startAt: now - 30*86400000, endAt: now }
    case '90d': return { startAt: now - 90*86400000, endAt: now }
    case 'year': return { startAt: new Date(d.getFullYear(), 0, 1).getTime(), endAt: now }
    case 'all': return { startAt: new Date('2024-01-01').getTime(), endAt: now }
    default: return { startAt: now - 86400000, endAt: now }
  }
}

interface AnalyticsData {
  active: number
  pageviews: number
  visitors: number
  avgSessionDuration: number
  newVisitors: number
  returningVisitors: number
  pages: { x: string; y: number }[]
  referrers: { x: string; y: number }[]
  browsers: { x: string; y: number }[]
  devices: { x: string; y: number }[]
  provinces: { x: string; y: number }[]
  skillViews: { skillId: string; title: string; views: number }[]
  pathFlows: { from: string; to: string; count: number }[]
  searchKeywords: { query: string; count: number }[]
  hourlyTrend: { hour: string; count: number }[]
  funnel: {
    visitors: number
    registrations: number
    installs: number
    favorites: number
    comments: number
  }
}

const PATH_NAME_MAP: Record<string, string> = {
  '/': '首页',
  '/skills': 'Skills 浏览',
  '/submit': '提交 Skill',
  '/login': '登录',
  '/register': '注册',
  '/profile': '个人主页',
  '/admin': '管理后台',
  '/admin/analytics': '数据分析',
  '/admin/users': '用户管理',
  '/admin/skills': 'Skills 管理',
  '/admin/reviews': '审核队列',
  '/admin/categories': '分类管理',
}

function pathToName(path: string, skillMap?: Record<string, string>): string {
  if (!path || path === '/') return '首页'
  const stripped = path.replace(/^\/(zh|en)/, '') || '/'
  const skillMatch = stripped.match(/^\/skills\/([^/?#]+)/)
  if (skillMatch && !['page', 'new', 'edit'].includes(skillMatch[1])) {
    return skillMap?.[skillMatch[1]] ?? '技能详情'
  }
  const authorMatch = stripped.match(/^\/authors\/([^/?#]+)/)
  if (authorMatch) return `作者: ${authorMatch[1]}`
  return PATH_NAME_MAP[stripped] ?? PATH_NAME_MAP[path] ?? path
}

const REFERRER_DOMAIN_MAP: Record<string, string> = {
  'google.com': 'Google',
  'google.com.hk': 'Google',
  'google.co.jp': 'Google',
  'baidu.com': '百度',
  'github.com': 'GitHub',
  'zhihu.com': '知乎',
  't.co': 'Twitter / X',
  'twitter.com': 'Twitter / X',
  'x.com': 'Twitter / X',
  'weixin.qq.com': '微信',
  'mp.weixin.qq.com': '微信公众号',
  'juejin.cn': '掘金',
  'v2ex.com': 'V2EX',
  'bing.com': 'Bing',
  'linkedin.com': 'LinkedIn',
  'segmentfault.com': 'SegmentFault',
}

function referrerToName(url: string): string {
  if (!url) return '直接访问'
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (typeof window !== 'undefined' && hostname === window.location.hostname) return '站内跳转'
    return REFERRER_DOMAIN_MAP[hostname] ?? hostname
  } catch {
    return url.slice(0, 30)
  }
}

const DEVICE_GROUPS: Record<string, string[]> = {
  '移动设备': ['Mobile', 'iPhone', 'Android'],
  '平板设备': ['Tablet', 'iPad', 'Android Tablet'],
  '桌面设备': ['Desktop', 'Mac', 'Windows', 'Linux'],
}

function groupDevices(devices: { x: string; y: number }[]) {
  return Object.entries(DEVICE_GROUPS).map(([group, subtypes]) => {
    const items = devices.filter(d => subtypes.includes(d.x))
    const total = items.reduce((s, d) => s + d.y, 0)
    return { group, total, items }
  }).filter(g => g.total > 0)
}

function fmtDuration(seconds: number) {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function pct(a: number, b: number) {
  if (!b) return '—'
  return (a / b * 100).toFixed(1) + '%'
}

// 纯 CSS 柱状图
function BarChart({ data }: { data: { hour: string; count: number }[] }) {
  if (!data.length) return <p className="text-xs text-muted-foreground font-mono">暂无数据</p>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex h-16 mt-2 gap-px">
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * 100, 2)
        const hour = new Date(d.hour).getHours()
        return (
          <div key={i} className="flex-1 relative group">
            <div
              className="absolute bottom-0 w-full bg-brand/60 hover:bg-brand transition-colors"
              style={{ height: `${h}%` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex
              bg-foreground text-background text-xs font-mono px-1.5 py-0.5 whitespace-nowrap z-10">
              {hour}时 {d.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AdminAnalyticsStats() {
  const [period, setPeriod] = useState('24h')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<AnalyticsData | null>(null)
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
      const res = await fetch(`/api/admin/analytics?startAt=${startAt}&endAt=${endAt}`)
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

  const skillTitleMap = Object.fromEntries(
    (data?.skillViews ?? []).map(s => [s.skillId, s.title])
  )

  const funnel = data?.funnel
  const funnelSteps = funnel ? [
    { label: '独立访客', value: funnel.visitors, rate: null },
    { label: '新注册', value: funnel.registrations, rate: pct(funnel.registrations, funnel.visitors) },
    { label: '安装技能', value: funnel.installs, rate: pct(funnel.installs, funnel.visitors) },
    { label: '收藏', value: funnel.favorites, rate: pct(funnel.favorites, funnel.visitors) },
    { label: '评论', value: funnel.comments, rate: pct(funnel.comments, funnel.visitors) },
  ] : []
  const funnelMax = funnelSteps[0]?.value || 1

  return (
    <section className="space-y-0">
      {/* 标题栏 + 筛选 */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">访客数据</h2>
          <span className="flex items-center gap-1.5 text-xs font-mono text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            {data?.active ?? 0} 人在线
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`${btnBase} ${period === p.value ? btnActive : btnInactive}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="border border-border bg-card px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand" />
          <span className="text-xs text-muted-foreground font-mono">—</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="border border-border bg-card px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-brand" />
          <button onClick={() => { if (customStart && customEnd) fetchData('custom', customStart, customEnd) }}
            disabled={!customStart || !customEnd}
            className="border border-foreground px-4 py-1.5 text-xs font-mono hover:bg-brand hover:text-white hover:border-brand transition-colors disabled:opacity-40">
            查询
          </button>
        </div>
      )}

      {/* 核心指标 */}
      <div className={`grid grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border transition-opacity ${fade}`}>
        {[
          { label: '页面浏览量', value: loading ? '…' : (data?.pageviews ?? 0).toLocaleString(), sub: 'PV' },
          { label: '独立访客', value: loading ? '…' : (data?.visitors ?? 0).toLocaleString(), sub: 'UV（按 IP 去重）' },
          { label: '平均访问时长', value: loading ? '…' : fmtDuration(data?.avgSessionDuration ?? 0), sub: '每次会话' },
          { label: '新访客', value: loading ? '…' : (data?.newVisitors ?? 0).toLocaleString(), sub: '首次访问' },
          { label: '回访用户', value: loading ? '…' : (data?.returningVisitors ?? 0).toLocaleString(), sub: '历史已访问' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
            <p className="font-heading text-4xl font-black text-foreground">{value}</p>
            <p className="text-xs mt-2 font-mono text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* 转化漏斗 */}
      <div className={`border border-border border-t-0 bg-card p-5 transition-opacity ${fade}`}>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">转化漏斗</p>
        {funnelSteps.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">暂无数据</p>
        ) : (
          <div className="space-y-2.5">
            {funnelSteps.map(({ label, value, rate }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">{label}</span>
                <div className="flex-1 bg-border h-5 relative overflow-hidden">
                  <div
                    className="h-full bg-brand/20 border-r-2 border-brand transition-all"
                    style={{ width: `${Math.max((value / funnelMax) * 100, 1)}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-medium text-foreground w-14 text-right">{value.toLocaleString()}</span>
                {rate && <span className="font-mono text-xs text-muted-foreground w-12 text-right">{rate}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 每小时 PV 趋势 */}
      <div className={`border border-border border-t-0 bg-card p-5 transition-opacity ${fade}`}>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">PV 趋势（按小时）</p>
        <BarChart data={data?.hourlyTrend ?? []} />
      </div>

      {/* 热门页面 + 访客来源 */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0 transition-opacity ${fade}`}>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">热门页面</p>
          <div className="space-y-2.5">
            {!loading && (data?.pages ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
            {(data?.pages ?? []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{pathToName(p.x, skillTitleMap)}</span>
                <span className="font-mono text-xs text-brand font-medium">{p.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">访客来源</p>
          <div className="space-y-2.5">
            {!loading && (data?.referrers ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据（主要来自直接访问）</p>}
            {(data?.referrers ?? []).map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{referrerToName(r.x)}</span>
                <span className="font-mono text-xs text-brand font-medium">{r.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 热门技能详情页 + 搜索关键词 */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0 transition-opacity ${fade}`}>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">热门技能页</p>
          <div className="space-y-2.5">
            {!loading && (data?.skillViews ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
            {(data?.skillViews ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{s.title}</span>
                <span className="font-mono text-xs text-brand font-medium">{s.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">搜索关键词</p>
          <div className="space-y-2.5">
            {!loading && (data?.searchKeywords ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无搜索记录</p>}
            {(data?.searchKeywords ?? []).map((k, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{k.query}</span>
                <span className="font-mono text-xs text-brand font-medium">{k.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 浏览器 + 设备 + 省份 */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border border-t-0 transition-opacity ${fade}`}>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">浏览器</p>
          <div className="space-y-2.5">
            {!loading && (data?.browsers ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
            {(data?.browsers ?? []).map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1">{b.x}</span>
                <span className="font-mono text-xs text-brand font-medium">{b.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">设备类型</p>
          <div className="space-y-3">
            {!loading && (data?.devices ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
            {groupDevices(data?.devices ?? []).map(g => (
              <div key={g.group}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-foreground font-medium flex-1">{g.group}</span>
                  <span className="font-mono text-xs text-brand font-medium">{g.total.toLocaleString()}</span>
                </div>
                {g.items.length > 1 && g.items.map(item => (
                  <div key={item.x} className="flex items-center gap-3 pl-3 mb-0.5">
                    <span className="text-xs text-muted-foreground font-mono flex-1">{item.x}</span>
                    <span className="font-mono text-xs text-muted-foreground">{item.y.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">省份分布</p>
          <div className="space-y-2.5">
            {!loading && (data?.provinces ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据</p>}
            {(data?.provinces ?? []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1">{p.x}</span>
                <span className="font-mono text-xs text-brand font-medium">{p.y.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 路径流向 */}
      <div className={`border border-border border-t-0 bg-card p-5 transition-opacity ${fade}`}>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">路径流向（最常见跳转）</p>
        <div className="space-y-2.5">
          {!loading && (data?.pathFlows ?? []).length === 0 && <p className="text-xs text-muted-foreground font-mono">暂无数据（需要会话记录积累）</p>}
          {(data?.pathFlows ?? []).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{pathToName(f.from, skillTitleMap) || '首页'}</span>
              <span className="text-xs text-muted-foreground font-mono">→</span>
              <span className="text-xs font-mono text-foreground flex-1 truncate">{pathToName(f.to, skillTitleMap) || '首页'}</span>
              <span className="font-mono text-xs text-brand font-medium">{f.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
