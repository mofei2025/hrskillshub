# 管理后台数据看板改进 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复管理后台数据看板的七个展示问题，包括 BarChart 渲染 bug、路径/来源/省份名称可读化、关键词过滤、设备细分和区块排序。

**Architecture:** 分层处理——数据过滤/转换在服务端 API（关键词过滤、省份全称、设备细化），纯展示命名在客户端组件（路径名、来源名、设备分组）；CSS bug 在组件层修复。

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma, Tailwind CSS

---

## 文件清单

| 文件 | 改动内容 |
|---|---|
| `app/api/admin/analytics/route.ts` | 搜索关键词过滤预设词；省份代码→全称映射 |
| `app/api/track/route.ts` | parseUA 返回更细粒度设备类型 |
| `app/[locale]/admin/analytics/page.tsx` | 修复 BarChart CSS（DAU/WAU 趋势图） |
| `components/admin-analytics-stats.tsx` | 修复 BarChart CSS（PV 趋势图）；添加路径/来源/设备映射函数；更新渲染区块 |
| `app/[locale]/admin/page.tsx` | 把"用户数据"区块移到"访客数据"上方 |

---

## Task 1：修复分析 API — 关键词过滤 + 省份全称

**Files:**
- Modify: `app/api/admin/analytics/route.ts`

- [ ] **Step 1：在文件顶部（import 之后）加入常量**

在 `app/api/admin/analytics/route.ts` 第 1 行 import 下方插入：

```ts
const PRESET_KEYWORDS = ['面试话术', '绩效评估', '薪酬分析', '入职培训', 'OKR 助手', '离职分析']

const PROVINCE_MAP: Record<string, string> = {
  BJ: '北京市', TJ: '天津市', HE: '河北省', SX: '山西省', NM: '内蒙古自治区',
  LN: '辽宁省', JL: '吉林省', HL: '黑龙江省', SH: '上海市', JS: '江苏省',
  ZJ: '浙江省', AH: '安徽省', FJ: '福建省', JX: '江西省', SD: '山东省',
  HA: '河南省', HB: '湖北省', HN: '湖南省', GD: '广东省', GX: '广西壮族自治区',
  HI: '海南省', CQ: '重庆市', SC: '四川省', GZ: '贵州省', YN: '云南省',
  XZ: '西藏自治区', SN: '陕西省', GS: '甘肃省', QH: '青海省', NX: '宁夏回族自治区',
  XJ: '新疆维吾尔自治区', TW: '台湾省', HK: '香港特别行政区', MO: '澳门特别行政区',
}

function getProvinceName(code: string | null): string {
  if (!code) return '未知'
  const key = code.replace(/^CN-/, '')
  return PROVINCE_MAP[key] ?? code
}
```

- [ ] **Step 2：修改 searchKeywords 查询，过滤预设词**

找到文件中 `db.searchEvent.groupBy` 这段（约在 `Promise.all` 内部），将：

```ts
    // 搜索关键词
    db.searchEvent.groupBy({
      by: ['query'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    }),
```

替换为：

```ts
    // 搜索关键词
    db.searchEvent.groupBy({
      by: ['query'],
      where: {
        createdAt: { gte: start, lte: end },
        NOT: { query: { in: PRESET_KEYWORDS } },
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    }),
```

- [ ] **Step 3：在 return 语句中应用省份全称映射**

找到 return 的 `provinces:` 这行：

```ts
    provinces: provinceGroups.map(g => ({ x: g.province ?? '未知', y: g._count.province })),
```

替换为：

```ts
    provinces: provinceGroups.map(g => ({ x: getProvinceName(g.province), y: g._count.province })),
```

- [ ] **Step 4：验证**

启动开发服务器（`npm run dev`），进入管理后台数据看板，选择"7天"时间段：
- 搜索关键词区块不再出现"面试话术"等预设词
- 省份分布显示"广东省"而不是"GD"，台湾若有数据显示"台湾省"

- [ ] **Step 5：提交**

```bash
git add app/api/admin/analytics/route.ts
git commit -m "fix: 过滤预设搜索关键词，省份代码转全称"
```

---

## Task 2：细化设备类型追踪

**Files:**
- Modify: `app/api/track/route.ts`

- [ ] **Step 1：替换 parseUA 函数中的 device 判断逻辑**

找到 `app/api/track/route.ts` 中的 `parseUA` 函数，将其中的 `device` 赋值部分：

```ts
  const device =
    /mobile|android|iphone/.test(lc) ? 'Mobile' :
    /ipad|tablet/.test(lc) ? 'Tablet' :
    'Desktop'
```

替换为：

```ts
  let device: string
  if (/iphone/.test(lc)) device = 'iPhone'
  else if (/ipad/.test(lc)) device = 'iPad'
  else if (/android/.test(lc) && /mobile/.test(lc)) device = 'Android'
  else if (/android/.test(lc)) device = 'Android Tablet'
  else if (/macintosh|mac os x/.test(lc)) device = 'Mac'
  else if (/windows/.test(lc)) device = 'Windows'
  else if (/linux/.test(lc)) device = 'Linux'
  else device = 'Desktop'
```

- [ ] **Step 2：验证**

用手机浏览器（或 DevTools 切换 UA）访问站点首页，触发一次追踪；回到管理后台，新记录的设备类型应为 `iPhone` 或 `Android` 而非 `Mobile`。（历史数据仍显示 `Mobile`，属预期行为。）

- [ ] **Step 3：提交**

```bash
git add app/api/track/route.ts
git commit -m "fix: 细化设备类型追踪，区分 iPhone/Android/Mac/Windows"
```

---

## Task 3：修复活跃趋势页 BarChart（DAU/WAU 趋势图）

**Files:**
- Modify: `app/[locale]/admin/analytics/page.tsx`

- [ ] **Step 1：替换 BarChart 组件**

找到 `app/[locale]/admin/analytics/page.tsx` 中的 `BarChart` 函数，将整个函数替换为：

```tsx
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
```

注意：原函数有 `color` 参数但实际未使用，此次一并移除（调用处也没传），保持 YAGNI。

- [ ] **Step 2：验证**

进入管理后台 → 活跃趋势页，选"30天"：DAU 柱状图和 WAU 柱状图应正常渲染，柱子从底部向上生长，鼠标悬停有数值提示。

- [ ] **Step 3：提交**

```bash
git add app/[locale]/admin/analytics/page.tsx
git commit -m "fix: 修复活跃趋势页 BarChart CSS，柱子正常渲染"
```

---

## Task 4：修复 PV 趋势图 BarChart 并添加展示映射函数

**Files:**
- Modify: `components/admin-analytics-stats.tsx`

此 Task 分两个子步骤：先修复 BarChart，再添加映射函数并更新三处渲染区块。

### 4a：修复 BarChart（PV 趋势）

- [ ] **Step 1：替换 BarChart 函数**

找到 `components/admin-analytics-stats.tsx` 中的 `BarChart` 函数，将整个函数替换为：

```tsx
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
```

### 4b：添加映射函数

- [ ] **Step 2：在 `fmtDuration` 函数上方插入三个映射工具函数**

```tsx
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
```

### 4c：更新渲染区块

- [ ] **Step 3：在 `AdminAnalyticsStats` 函数体内（data/loading 等 state 之后）添加 skillTitleMap**

找到组件内 `const funnel = data?.funnel` 这一行，在其上方插入：

```tsx
  const skillTitleMap = Object.fromEntries(
    (data?.skillViews ?? []).map(s => [s.skillId, s.title])
  )
```

- [ ] **Step 4：更新"热门页面"渲染区块**

找到热门页面的 map（约在 `{(data?.pages ?? []).map(` 处），将：

```tsx
            {(data?.pages ?? []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{p.x || '/'}</span>
                <span className="font-mono text-xs text-brand font-medium">{p.y.toLocaleString()}</span>
              </div>
            ))}
```

替换为：

```tsx
            {(data?.pages ?? []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{pathToName(p.x, skillTitleMap)}</span>
                <span className="font-mono text-xs text-brand font-medium">{p.y.toLocaleString()}</span>
              </div>
            ))}
```

- [ ] **Step 5：更新"访客来源"渲染区块**

找到访客来源的 map（约在 `{(data?.referrers ?? []).map(` 处），将：

```tsx
            {(data?.referrers ?? []).map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{r.x || '直接访问'}</span>
                <span className="font-mono text-xs text-brand font-medium">{r.y.toLocaleString()}</span>
              </div>
            ))}
```

替换为：

```tsx
            {(data?.referrers ?? []).map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-xs text-foreground font-mono flex-1 truncate">{referrerToName(r.x)}</span>
                <span className="font-mono text-xs text-brand font-medium">{r.y.toLocaleString()}</span>
              </div>
            ))}
```

- [ ] **Step 6：替换"设备类型"区块**

找到设备类型区块（含 `text-muted-foreground mb-4">设备类型`），将整个 `<div className="bg-card p-5">` 内部内容替换为：

```tsx
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
```

- [ ] **Step 7：更新"路径流向"渲染区块**

找到路径流向的 map（约在 `{(data?.pathFlows ?? []).map(` 处），将：

```tsx
          {(data?.pathFlows ?? []).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{f.from || '/'}</span>
              <span className="text-xs text-muted-foreground font-mono">→</span>
              <span className="text-xs font-mono text-foreground flex-1 truncate">{f.to || '/'}</span>
              <span className="font-mono text-xs text-brand font-medium">{f.count}</span>
            </div>
          ))}
```

替换为：

```tsx
          {(data?.pathFlows ?? []).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{String(i+1).padStart(2,'0')}</span>
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{pathToName(f.from, skillTitleMap) || '首页'}</span>
              <span className="text-xs text-muted-foreground font-mono">→</span>
              <span className="text-xs font-mono text-foreground flex-1 truncate">{pathToName(f.to, skillTitleMap) || '首页'}</span>
              <span className="font-mono text-xs text-brand font-medium">{f.count}</span>
            </div>
          ))}
```

- [ ] **Step 8：验证**

进入管理后台数据看板：
- PV 趋势图正常渲染（有柱子）
- 热门页面显示"首页"、"Skills 浏览"等中文名
- 访客来源显示"Google"、"百度"等名称，空来源显示"直接访问"
- 设备类型按大类展示，子类型缩进列出
- 路径流向显示中文页面名称

- [ ] **Step 9：提交**

```bash
git add components/admin-analytics-stats.tsx
git commit -m "fix: 修复 PV 趋势图渲染，添加路径/来源/设备可读化展示"
```

---

## Task 5：调整管理后台区块排序

**Files:**
- Modify: `app/[locale]/admin/page.tsx`

- [ ] **Step 1：把"用户数据"区块移到 `<AdminAnalyticsStats />` 上方**

找到 `app/[locale]/admin/page.tsx` 中的以下代码结构（当前顺序）：

```tsx
      {/* 访客数据 */}
      <AdminAnalyticsStats />

      {/* 用户数据 */}
      <section>
        <h2 ...>用户数据</h2>
        ...
      </section>
```

调整为（把用户数据 section 整体移到 `<AdminAnalyticsStats />` 之前）：

```tsx
      {/* 用户数据 */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-4">用户数据</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
          {[
            { label: '总注册用户', value: totalUsers, sub: null, href: '/admin/users', urgent: false },
            { label: '今日新增', value: newUsersToday, sub: '今天', href: '/admin/users', urgent: false },
            { label: '本周新增', value: newUsersThisWeek, sub: '近 7 天', href: '/admin/users', urgent: false },
            { label: '待审核', value: pendingSkills, sub: pendingSkills > 0 ? '需要处理' : '暂无', href: '/admin/reviews', urgent: pendingSkills > 0 },
          ].map(({ label, value, sub, href, urgent }) => (
            <Link key={label} href={href}>
              <div className={`bg-card p-6 h-full hover:bg-[var(--hero-bg)] transition-colors ${urgent ? 'border-l-2 border-l-amber-400' : ''}`}>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
                <p className={`font-heading text-4xl font-black ${urgent ? 'text-amber-500' : 'text-foreground'}`}>{value}</p>
                {sub && <p className={`text-xs mt-2 font-mono ${urgent ? 'text-amber-500' : 'text-muted-foreground'}`}>{sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 访客数据 */}
      <AdminAnalyticsStats />
```

- [ ] **Step 2：验证**

进入管理后台总览页，确认顺序为：标题 → 用户数据 → 访客数据 → Skills 数据 → 安装排行 → 快捷操作。

- [ ] **Step 3：提交**

```bash
git add app/[locale]/admin/page.tsx
git commit -m "fix: 将用户数据区块移至访客数据上方"
```

---

## 自检清单

- [x] Bug 修复（BarChart CSS）覆盖两个文件 ✓
- [x] 关键词过滤六个预设词 ✓
- [x] 省份全称含台湾省 ✓
- [x] 设备细分新增 7 种类型 ✓
- [x] 路径映射含 locale 前缀处理 ✓
- [x] 访客来源含"站内跳转"处理 ✓
- [x] 设备分组显示历史数据兼容（Mobile/Tablet/Desktop 归入大类） ✓
- [x] 区块排序调整 ✓
- [x] 所有 Task 含完整代码，无占位符 ✓
