# 管理后台数据看板改进设计文档

**日期**：2026-06-11
**状态**：已批准

---

## 问题概述

管理后台数据看板存在以下问题：

1. PV 趋势图无数据（BarChart CSS bug，柱子高度为 0）
2. 活跃趋势页 DAU/WAU 图表同样无法渲染（同一 CSS bug）
3. 热门页面显示代码路径（如 `/skills/cuid`），应显示页面名称
4. 访客来源显示完整 URL，应显示站点名
5. 搜索关键词排行榜包含预设词，需排除
6. 设备类型过于粗糙（仅 Mobile/Tablet/Desktop），需细化
7. 省份分布显示代码简写（如 `GD`），需显示全称；台湾必须显示"台湾省"
8. 路径流向显示代码路径，应显示页面名称
9. 用户数据区块位于访客数据下方，需调整顺序

---

## 实现方案：方案 C（分层处理）

- **服务端**：关键词过滤、省份全称、设备类型细化
- **客户端**：路径名/来源名映射、设备分组、排版调整、CSS 修复

---

## 第一节：Bug 修复（BarChart CSS）

**根因**：BarChart 容器使用 `flex items-end`，子项高度由内容决定（非 stretch），子项内柱子 `height: X%` 无法解析 → 高度为 0。

**修复**：
- 容器去掉 `items-end`，改用默认 `stretch` 对齐
- 每个 flex 子项加 `relative`
- 柱子改为 `absolute bottom-0 w-full`，从底部向上生长

**影响文件**：
- `components/admin-analytics-stats.tsx`（PV 趋势图）
- `app/[locale]/admin/analytics/page.tsx`（DAU/WAU 图）

---

## 第二节：服务端改动

### 2.1 搜索关键词过滤（`app/api/admin/analytics/route.ts`）

在 `searchEvent.groupBy` 查询中添加 `NOT` 条件，排除以下预设词：

```
面试话术、绩效评估、薪酬分析、入职培训、OKR 助手、离职分析
```

### 2.2 省份全称转换（`app/api/admin/analytics/route.ts`）

新增 `PROVINCE_MAP`，将 geoip-lite 返回的 2 字母代码转为完整省份名称：

- BJ → 北京市
- SH → 上海市
- GD → 广东省
- TW → **台湾省**（必须显示）
- HK → 香港特别行政区
- MO → 澳门特别行政区
- 其余 28 个省市自治区均列入映射表

在返回 `provinces` 数组前应用映射，未知代码显示原值。

### 2.3 设备类型细化（`app/api/track/route.ts`）

更新 `parseUA()` 函数，返回更细粒度的设备类型（仅影响新数据，历史数据不变）：

| UA 特征 | 新存储值 |
|---|---|
| iPhone | `iPhone` |
| iPad | `iPad` |
| Android + Mobile | `Android` |
| Android + Tablet | `Android Tablet` |
| Macintosh / Mac OS | `Mac` |
| Windows | `Windows` |
| Linux（非 Android） | `Linux` |
| 其他 | `Desktop` |

---

## 第三节：前端展示转换（`components/admin-analytics-stats.tsx`）

### 3.1 路径→页面名称映射

新增 `pathToName(path, skillMap?)` 函数：

| 路径 | 显示名称 |
|---|---|
| `/` 或空 | 首页 |
| `/skills` | Skills 浏览 |
| `/skills/[id]` | 从 skillViews 查标题，未知则"技能详情" |
| `/submit` | 提交 Skill |
| `/login` | 登录 |
| `/register` | 注册 |
| `/profile` | 个人主页 |
| `/admin` | 管理后台 |
| `/admin/analytics` | 数据分析 |
| `/admin/users` | 用户管理 |
| `/admin/skills` | Skills 管理 |
| `/admin/reviews` | 审核队列 |
| `/admin/categories` | 分类管理 |
| `/authors/[name]` | 作者: [name] |
| 其他 | 原路径 |

支持 `/zh/`、`/en/` locale 前缀自动剥离后匹配。

应用于：**热门页面**（`pages`）、**路径流向**（`pathFlows` 的 from/to）。

### 3.2 访客来源→站点名映射

新增 `referrerToName(url)` 函数：

| 域名 | 显示名称 |
|---|---|
| 空/无 | 直接访问 |
| google.com / google.com.hk | Google |
| baidu.com | 百度 |
| github.com | GitHub |
| zhihu.com | 知乎 |
| t.co / twitter.com / x.com | Twitter / X |
| weixin.qq.com | 微信 |
| mp.weixin.qq.com | 微信公众号 |
| juejin.cn | 掘金 |
| v2ex.com | V2EX |
| bing.com | Bing |
| linkedin.com | LinkedIn |
| 本站域名 | 站内跳转 |
| 其他 | 域名（去掉 www.） |

### 3.3 设备类型分组显示

对 `devices` 数据按大类归并后，展示层级结构：

```
移动设备  (合计 N)
  iPhone     (n1)
  Android    (n2)
  Mobile     (n3)  ← 历史数据
平板设备  (合计 N)
  iPad       (n1)
  ...
桌面设备  (合计 N)
  Mac        (n1)
  Windows    (n2)
  ...
```

### 3.4 区块排序（`app/[locale]/admin/page.tsx`）

将"用户数据"区块移至"访客数据"（`<AdminAnalyticsStats />`）上方。

---

## 涉及文件清单

| 文件 | 改动类型 |
|---|---|
| `components/admin-analytics-stats.tsx` | CSS 修复 + 路径/来源/设备名称映射 |
| `app/[locale]/admin/analytics/page.tsx` | CSS 修复 |
| `app/api/admin/analytics/route.ts` | 关键词过滤 + 省份全称 |
| `app/api/track/route.ts` | 设备类型细化 |
| `app/[locale]/admin/page.tsx` | 区块顺序调整 |
