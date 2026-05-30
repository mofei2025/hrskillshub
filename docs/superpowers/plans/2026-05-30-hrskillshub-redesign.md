# HRSkillsHub 全面升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 HRSkillsHub 从现有紫色系设计全面升级为瑞士包豪斯风格（Archivo Black + Space Grotesk，红色 #ff3300 品牌色），新增作者主页、一键安装命令、版本历史、相关推荐、中英双语、安全评级 6 个功能模块。

**Architecture:** 分 7 个阶段递进实施：先完成 DB 迁移和设计系统基础（所有后续步骤依赖），再逐页重构（首页→列表页→详情页→作者页），然后扩展管理后台，最后收尾 i18n。每个阶段产出可独立运行的软件，不破坏现有功能。

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 7 + PostgreSQL, next-themes@0.4.6（已安装）, next-intl, Tailwind CSS v3, shadcn/ui, Google Fonts (Archivo Black + Space Grotesk + JetBrains Mono)

---

## 文件结构

### 修改的文件
- `prisma/schema.prisma` — 新增 SecurityGrade enum、SkillVersion 模型、Follow 模型；Skill 新增 5 个字段；User 新增 bio 字段
- `app/globals.css` — 完全替换 CSS 变量为 Swiss Modern 系统（黑白红，无圆角）
- `app/layout.tsx` — 新增 Google Fonts（Archivo Black + Space Grotesk + JetBrains Mono）、ThemeProvider（next-themes）
- `next.config.mjs` — 新增 next-intl 插件配置（Task 17）
- `tailwind.config.ts` — 调整 radius 为 0（无圆角）
- `components/nav.tsx` — 完全重构：3px 红线、新导航项、主题切换、语言切换
- `components/skill-card.tsx` — 新增 Grade 徽章、更新 Swiss Modern 卡片样式
- `components/skill-filters.tsx` — 新增 Grade 筛选器
- `app/page.tsx` — 完全重写：搜索优先英雄区、分类网格、统计数字、Skills 网格
- `app/skills/page.tsx` — 新增 Grade 筛选器 UI
- `app/skills/[id]/page.tsx` — 完全重构：两栏布局、新侧栏、使用新子组件
- `app/api/skills/route.ts` — 新增 `grade` 查询参数
- `app/admin/skills/page.tsx` — 新增安全评级设置入口

### 新建的文件
- `components/grade-badge.tsx` — A/B/C/PENDING 安全等级彩色徽章
- `components/theme-toggle.tsx` — 明暗模式切换按钮（月亮/太阳图标）
- `components/install-tabs.tsx` — 三合一安装 Tab（Claude Code / 复制内容 / 下载文件）
- `components/version-history.tsx` — 版本历史列表
- `components/related-skills.tsx` — 相关推荐（3 条）
- `components/security-panel.tsx` — 安全评级详情面板
- `components/follow-button.tsx` — 关注/取消关注按钮
- `app/authors/[username]/page.tsx` — 作者主页
- `app/api/authors/[username]/route.ts` — 作者信息 + 统计 API
- `app/api/authors/[username]/skills/route.ts` — 作者发布的 Skills API
- `app/api/users/[id]/follow/route.ts` — 关注/取消关注 API
- `app/api/skills/[id]/versions/route.ts` — 版本历史 GET/POST API
- `app/api/skills/[id]/related/route.ts` — 相关推荐 API
- `app/api/admin/skills/[id]/grade/route.ts` — 安全评级设置 API（ADMIN）
- `middleware.ts` — next-intl 路由中间件（Task 17）
- `messages/zh.json` — 中文翻译文件（Task 17）
- `messages/en.json` — 英文翻译文件（Task 17）

---

## Task 1: 数据库 Schema 迁移

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1.1: 更新 schema.prisma**

将以下内容替换到 `prisma/schema.prisma`（完整文件）：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  password      String
  nickname      String
  role          Role       @default(USER)
  avatarUrl     String?
  bio           String?
  createdAt     DateTime   @default(now())

  skills        Skill[]
  favorites     Favorite[]
  downloads     Download[]
  comments      Comment[]
  reviews       Review[]
  sessions      Session[]
  accounts      Account[]
  followedBy    Follow[]   @relation("following")
  following     Follow[]   @relation("follower")
}

enum Role {
  USER
  CONTRIBUTOR
  ADMIN
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  skills    Skill[]
}

model Skill {
  id                   String        @id @default(cuid())
  title                String
  description          String
  content              String?       @db.Text
  fileUrl              String?
  type                 SkillType
  compatibleAi         String[]
  categoryId           String
  category             Category      @relation(fields: [categoryId], references: [id])
  installCount         Int           @default(0)
  favoriteCount        Int           @default(0)
  downloadCount        Int           @default(0)
  authorId             String
  author               User          @relation(fields: [authorId], references: [id])
  status               SkillStatus   @default(PENDING)
  version              String        @default("1.0.0")
  securityGrade        SecurityGrade @default(PENDING)
  securityScore        Int?
  securityNotes        Json?
  securityOverriddenBy String?
  createdAt            DateTime      @default(now())
  publishedAt          DateTime?

  favorites     Favorite[]
  downloads     Download[]
  comments      Comment[]
  reviews       Review[]
  versions      SkillVersion[]
}

enum SkillType {
  PROMPT
  CLAUDE_SKILL
}

enum SkillStatus {
  PENDING
  PUBLISHED
  REJECTED
}

enum SecurityGrade {
  A
  B
  C
  PENDING
}

model SkillVersion {
  id        String   @id @default(cuid())
  skillId   String
  version   String
  changelog String
  createdAt DateTime @default(now())
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User     @relation("follower", fields: [followerId], references: [id])
  following   User     @relation("following", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  skillId   String
  user      User     @relation(fields: [userId], references: [id])
  skill     Skill    @relation(fields: [skillId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, skillId])
}

model Download {
  id          String      @id @default(cuid())
  skillId     String
  userId      String
  installType InstallType
  skill       Skill       @relation(fields: [skillId], references: [id])
  user        User        @relation(fields: [userId], references: [id])
  createdAt   DateTime    @default(now())
}

enum InstallType {
  COPY_PROMPT
  COPY_COMMAND
  DOWNLOAD_FILE
}

model Comment {
  id        String   @id @default(cuid())
  skillId   String
  userId    String
  content   String
  rating    Int
  skill     Skill    @relation(fields: [skillId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

model Review {
  id        String       @id @default(cuid())
  skillId   String
  adminId   String
  action    ReviewAction
  feedback  String?
  skill     Skill        @relation(fields: [skillId], references: [id])
  admin     User         @relation(fields: [adminId], references: [id])
  createdAt DateTime     @default(now())
}

enum ReviewAction {
  APPROVED
  REJECTED
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **Step 1.2: 执行数据库迁移**

```bash
cd /Users/morphine/vibecoding/hrskillshub
npx prisma migrate dev --name add_security_grade_version_follow
```

预期输出：`Your database is now in sync with your schema.`

- [ ] **Step 1.3: 重新生成 Prisma Client**

```bash
npx prisma generate
```

- [ ] **Step 1.4: 提交**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: 添加安全评级、版本历史、关注功能的 DB Schema"
```

---

## Task 2: 设计系统 - CSS 变量与字体

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 2.1: 更新 globals.css — Swiss Modern 设计系统**

完整替换 `app/globals.css`：

```css
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  /* Swiss Modern 品牌色工具类 */
  .text-brand { color: #ff3300; }
  .bg-brand { background-color: #ff3300; }
  .border-brand { border-color: #ff3300; }
  /* 字体工具类 */
  .font-heading { font-family: var(--font-heading); }
  .font-mono-code { font-family: var(--font-mono); }
}

@layer base {
  /* ===== 亮色模式（默认）===== */
  :root {
    /* 品牌色（两种模式完全一致） */
    --brand: #ff3300;
    --brand-foreground: #ffffff;

    /* 页面基础色 */
    --background: #ffffff;
    --foreground: #000000;

    /* 英雄区背景 */
    --hero-bg: #f5f5f5;

    /* 导航背景 */
    --nav-bg: #ffffff;

    /* 卡片 */
    --card: #ffffff;
    --card-foreground: #000000;
    --card-border: #e8e8e8;

    /* 弹窗 */
    --popover: #ffffff;
    --popover-foreground: #000000;

    /* 主色（黑色）*/
    --primary: #000000;
    --primary-foreground: #ffffff;

    /* 次级（浅灰） */
    --secondary: #f5f5f5;
    --secondary-foreground: #000000;

    /* 静音色 */
    --muted: #f5f5f5;
    --muted-foreground: #555555;

    /* 强调色（品牌红）*/
    --accent: #ff3300;
    --accent-foreground: #ffffff;

    /* 危险 */
    --destructive: #dc2626;

    /* 边框 */
    --border: #e8e8e8;
    --input: #e8e8e8;
    --ring: #000000;

    /* 搜索框 */
    --search-border: #000000;
    --search-border-width: 2px;

    /* 分类激活色（红色） */
    --category-active-bg: #ff3300;
    --category-active-fg: #ffffff;

    /* 次级文字 */
    --text-secondary: #555555;

    /* 无圆角 */
    --radius: 0rem;

    /* 图表色 */
    --chart-1: #000000;
    --chart-2: #ff3300;
    --chart-3: #555555;
    --chart-4: #e8e8e8;
    --chart-5: #f5f5f5;

    /* Sidebar（管理后台） */
    --sidebar: #f5f5f5;
    --sidebar-foreground: #000000;
    --sidebar-primary: #000000;
    --sidebar-primary-foreground: #ffffff;
    --sidebar-accent: #e8e8e8;
    --sidebar-accent-foreground: #000000;
    --sidebar-border: #e8e8e8;
    --sidebar-ring: #000000;
  }

  /* ===== 夜间模式 ===== */
  [data-theme="dark"] {
    /* 品牌色保持不变 */
    --brand: #ff3300;
    --brand-foreground: #ffffff;

    /* 页面基础色 */
    --background: #0d0d0d;
    --foreground: #f0f0f0;

    /* 英雄区背景 */
    --hero-bg: #0a0a0a;

    /* 导航背景 */
    --nav-bg: #0a0a0a;

    /* 卡片 */
    --card: #111111;
    --card-foreground: #f0f0f0;
    --card-border: #1e1e1e;

    /* 弹窗 */
    --popover: #111111;
    --popover-foreground: #f0f0f0;

    /* 主色（近白）*/
    --primary: #f0f0f0;
    --primary-foreground: #0d0d0d;

    /* 次级 */
    --secondary: #1a1a1a;
    --secondary-foreground: #f0f0f0;

    /* 静音色 */
    --muted: #1a1a1a;
    --muted-foreground: #555555;

    /* 强调色（品牌红）*/
    --accent: #ff3300;
    --accent-foreground: #ffffff;

    /* 危险 */
    --destructive: #ef4444;

    /* 边框 */
    --border: #1e1e1e;
    --input: #1e1e1e;
    --ring: #f0f0f0;

    /* 搜索框 */
    --search-border: #2a2a2a;
    --search-border-width: 1px;

    /* 分类激活色（红色，夜间不变）*/
    --category-active-bg: #ff3300;
    --category-active-fg: #ffffff;

    /* 次级文字 */
    --text-secondary: #555555;

    /* 图表色 */
    --chart-1: #f0f0f0;
    --chart-2: #ff3300;
    --chart-3: #555555;
    --chart-4: #1e1e1e;
    --chart-5: #0a0a0a;

    /* Sidebar */
    --sidebar: #111111;
    --sidebar-foreground: #f0f0f0;
    --sidebar-primary: #f0f0f0;
    --sidebar-primary-foreground: #0d0d0d;
    --sidebar-accent: #1e1e1e;
    --sidebar-accent-foreground: #f0f0f0;
    --sidebar-border: #1e1e1e;
    --sidebar-ring: #f0f0f0;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body), system-ui, sans-serif;
  }

  html {
    font-family: var(--font-body), system-ui, sans-serif;
  }

  /* Swiss Modern：全局去掉圆角 */
  *,
  *::before,
  *::after {
    border-radius: 0 !important;
  }

  /* 品牌识别：顶部 3px 红线（通过 nav 实现，此处为辅助） */
  .brand-top-line {
    border-top: 3px solid #ff3300;
  }
}
```

- [ ] **Step 2.2: 更新 tailwind.config.ts**

读取当前 `tailwind.config.ts`，将 `borderRadius` 中的所有值改为 0：

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#ff3300",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "0px",
        md: "0px",
        sm: "0px",
        DEFAULT: "0px",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2.3: 更新 app/layout.tsx — 添加字体和 ThemeProvider**

```tsx
import type { Metadata } from 'next'
import { Archivo_Black, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/session-provider'
import { ThemeProvider } from 'next-themes'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'HRSkillsHub - HR 行业 AI Skills 分享平台',
  description: '专为 HR 从业者打造的 AI Skills 与提示词分享社区，精选经过安全审核的提示词与技能包',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Nav />
            <main>{children}</main>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2.4: 验证字体和主题加载**

```bash
cd /Users/morphine/vibecoding/hrskillshub
npm run dev
```

打开 `http://localhost:3000`，在 DevTools 检查：
- `<html>` 有 `data-theme` 属性
- `body` 使用 Space Grotesk 字体（DevTools → Computed → font-family）

- [ ] **Step 2.5: 提交**

```bash
git add app/globals.css app/layout.tsx tailwind.config.ts
git commit -m "feat: 建立 Swiss Modern 设计系统 - CSS 变量、字体、ThemeProvider"
```

---

## Task 3: ThemeToggle 组件 + Nav 重构

**Files:**
- Create: `components/theme-toggle.tsx`
- Modify: `components/nav.tsx`

- [ ] **Step 3.1: 创建 ThemeToggle 组件**

```tsx
// components/theme-toggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-8 h-8" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8 flex items-center justify-center hover:text-brand transition-colors"
      aria-label="切换明暗模式"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
```

- [ ] **Step 3.2: 重构 Nav 组件**

完整替换 `components/nav.tsx`（读取当前文件后替换）：

```tsx
// components/nav.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ThemeToggle } from './theme-toggle'

export async function Nav() {
  const session = await auth()

  return (
    <header className="border-t-[3px] border-brand sticky top-0 z-50 bg-[var(--nav-bg)] border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-lg font-black tracking-tight hover:text-brand transition-colors"
        >
          HR<span className="text-brand">Skills</span>Hub
        </Link>

        {/* 主导航 */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/skills" className="hover:text-brand transition-colors">
            Skills
          </Link>
          <Link href="/authors" className="hover:text-brand transition-colors">
            作者
          </Link>
          <Link href="/docs" className="hover:text-brand transition-colors text-muted-foreground">
            文档
          </Link>
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 语言切换（占位，Task 17 实现） */}
          <span className="hidden md:block text-xs text-muted-foreground cursor-not-allowed">
            中 / EN
          </span>

          {/* 明暗模式 */}
          <ThemeToggle />

          {/* 提交按钮 */}
          <Link
            href="/submit"
            className="hidden md:block text-sm px-3 py-1.5 border border-foreground hover:bg-brand hover:text-white hover:border-brand transition-colors font-medium"
          >
            提交 Skill
          </Link>

          {/* 用户状态 */}
          {session ? (
            <div className="flex items-center gap-2">
              {session.user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  管理
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm hover:text-brand transition-colors"
              >
                {session.user?.name ?? '我的'}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm hover:text-brand transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3.3: 验证导航栏**

```bash
npm run dev
```

确认：
- 顶部有 3px 红线
- Logo 中 "Skills" 为红色
- 主题切换按钮可用
- 导航项 hover 变红

- [ ] **Step 3.4: 提交**

```bash
git add components/theme-toggle.tsx components/nav.tsx
git commit -m "feat: 重构导航栏 - Swiss Modern 风格、ThemeToggle、3px 红线"
```

---

## Task 4: GradeBadge 组件

**Files:**
- Create: `components/grade-badge.tsx`

- [ ] **Step 4.1: 创建 GradeBadge 组件**

```tsx
// components/grade-badge.tsx
import { SecurityGrade } from '@prisma/client'

interface GradeBadgeProps {
  grade: SecurityGrade
  size?: 'sm' | 'md'
}

const gradeConfig = {
  A: { label: '✓ Grade A', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' },
  B: { label: 'Grade B', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700' },
  C: { label: 'Grade C', className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700' },
  PENDING: { label: '待评级', className: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600' },
}

export function GradeBadge({ grade, size = 'sm' }: GradeBadgeProps) {
  const config = gradeConfig[grade]
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span
      className={`inline-block border font-mono font-medium ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  )
}
```

- [ ] **Step 4.2: 提交**

```bash
git add components/grade-badge.tsx
git commit -m "feat: 添加 GradeBadge 安全评级徽章组件"
```

---

## Task 5: SkillCard 重构（Swiss Modern + Grade 徽章）

**Files:**
- Modify: `components/skill-card.tsx`

- [ ] **Step 5.1: 读取当前 skill-card.tsx**

读取 `components/skill-card.tsx` 确认当前内容，然后完整替换：

```tsx
// components/skill-card.tsx
import Link from 'next/link'
import { Download, Star, User } from 'lucide-react'
import { GradeBadge } from './grade-badge'
import type { Skill, Category, User as PrismaUser } from '@prisma/client'

type SkillWithRelations = Skill & {
  category: Category
  author: Pick<PrismaUser, 'nickname'>
  _count?: { comments: number }
}

interface SkillCardProps {
  skill: SkillWithRelations
}

export function SkillCard({ skill }: SkillCardProps) {
  const avgRating = null // 评分从 comments 聚合，此处简化

  return (
    <Link href={`/skills/${skill.id}`} className="group block">
      <article className="relative border border-[var(--card-border)] bg-card h-full hover:border-foreground transition-colors duration-150">
        {/* Grade 徽章 - 右上角 */}
        <div className="absolute top-3 right-3 z-10">
          <GradeBadge grade={skill.securityGrade} size="sm" />
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* 分类标签 */}
          <div className="mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {skill.category.name}
            </span>
          </div>

          {/* 标题 */}
          <h3 className="font-heading text-base font-black leading-tight mb-2 group-hover:text-brand transition-colors pr-20">
            {skill.title}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
            {skill.description}
          </p>

          {/* 底部：作者 + 统计 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User size={12} />
              {skill.author.nickname}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download size={12} />
                {skill.installCount.toLocaleString()}
              </span>
              {avgRating && (
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  {avgRating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hover 安装按钮 */}
        <div className="absolute bottom-0 left-0 right-0 bg-brand text-white text-xs font-medium text-center py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-150">
          安装 →
        </div>
      </article>
    </Link>
  )
}
```

- [ ] **Step 5.2: 提交**

```bash
git add components/skill-card.tsx
git commit -m "feat: 重构 SkillCard - Swiss Modern 样式、Grade 徽章、Hover 安装按钮"
```

---

## Task 6: 首页完全重写

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 6.1: 完整替换 app/page.tsx**

```tsx
// app/page.tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { Search, Briefcase, TrendingUp, Users, Award } from 'lucide-react'

// 分类图标映射
const categoryIcons: Record<string, string> = {
  recruitment: '🎯',
  performance: '📊',
  compensation: '💰',
  training: '📚',
  culture: '🌟',
  compliance: '⚖️',
}

async function getHomeData() {
  const [categories, featuredSkills, stats] = await Promise.all([
    db.category.findMany({
      include: { _count: { select: { skills: { where: { status: 'PUBLISHED' } } } } },
      orderBy: { name: 'asc' },
    }),
    db.skill.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { nickname: true } },
      },
      orderBy: { installCount: 'desc' },
      take: 9,
    }),
    Promise.all([
      db.skill.count({ where: { status: 'PUBLISHED' } }),
      db.skill.aggregate({ _sum: { installCount: true }, where: { status: 'PUBLISHED' } }),
      db.user.count(),
      db.skill.count({ where: { status: 'PUBLISHED', securityGrade: 'A' } }),
    ]),
  ])

  const [totalSkills, installAgg, totalUsers, gradeACount] = stats
  const totalInstalls = installAgg._sum.installCount ?? 0
  const gradeAPercent = totalSkills > 0 ? Math.round((gradeACount / totalSkills) * 100) : 0

  return { categories, featuredSkills, totalSkills, totalInstalls, totalUsers, gradeAPercent }
}

export default async function HomePage() {
  const { categories, featuredSkills, totalSkills, totalInstalls, totalUsers, gradeAPercent } =
    await getHomeData()

  return (
    <div className="min-h-screen">
      {/* ===== 英雄区 ===== */}
      <section
        className="bg-[var(--hero-bg)] border-b border-border py-20 px-4"
        style={{
          backgroundImage: `
            linear-gradient(var(--card-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--card-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand border border-brand px-3 py-1">
              HR AI Skills Marketplace
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl font-black leading-tight mb-4 tracking-tight">
            发现最好的
            <br />
            <span className="text-brand">HR AI Skills</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            精选 {totalSkills}+ 个经过安全审核的 HR 提示词与技能包
          </p>

          {/* 搜索框 */}
          <form action="/skills" method="get" className="max-w-2xl mx-auto mb-8">
            <div className="flex">
              <input
                name="q"
                type="text"
                placeholder="搜索 Skills，例如：面试话术、OKR 助手、绩效评估…"
                className="flex-1 px-4 py-3 text-sm border-[2px] border-foreground bg-card focus:outline-none focus:border-brand transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand text-white text-sm font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                搜索
              </button>
            </div>
          </form>

          {/* 热门搜索标签 */}
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            {['面试话术', 'OKR 助手', '绩效评估', '薪酬分析', '入职培训', '离职分析'].map((tag) => (
              <Link
                key={tag}
                href={`/skills?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 border border-border hover:border-brand hover:text-brand transition-colors text-muted-foreground"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 统计数字 ===== */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { value: `${totalSkills}+`, label: 'Skills' },
              {
                value: totalInstalls >= 1000
                  ? `${(totalInstalls / 1000).toFixed(1)}k`
                  : totalInstalls.toString(),
                label: '次安装',
              },
              { value: `${totalUsers.toLocaleString()}`, label: '贡献者' },
              { value: `${gradeAPercent}%`, label: 'Grade A' },
            ].map(({ value, label }) => (
              <div key={label} className="py-6 px-8 text-center">
                <div className="font-heading text-2xl font-black text-brand">{value}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 分类网格 ===== */}
      <section className="border-b border-border py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-xl font-black mb-6 uppercase tracking-tight">
            按分类浏览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/skills?category=${cat.slug}`}
                className="bg-card hover:bg-brand hover:text-white group p-6 text-center transition-colors"
              >
                <div className="text-2xl mb-2">{categoryIcons[cat.slug] ?? '📌'}</div>
                <div className="text-sm font-medium group-hover:text-white">{cat.name}</div>
                <div className="text-xs text-muted-foreground group-hover:text-white/70 mt-1">
                  {cat._count.skills} Skills
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Skills 网格 ===== */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-black uppercase tracking-tight">
              热门 Skills
            </h2>
            <Link
              href="/skills"
              className="text-sm text-muted-foreground hover:text-brand transition-colors"
            >
              查看全部 →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {featuredSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 6.2: 验证首页**

```bash
npm run dev
```

打开 `http://localhost:3000`，确认：
- 英雄区有网格背景纹理
- 搜索框 2px 黑色描边
- 统计数字显示正确
- 分类网格 hover 变红（不是黑色）
- Skills 卡片右上角有 Grade 徽章

- [ ] **Step 6.3: 提交**

```bash
git add app/page.tsx
git commit -m "feat: 重写首页 - 搜索优先英雄区、分类网格、统计数字、Skills 网格"
```

---

## Task 7: Skills 列表页升级（Grade 筛选器）

**Files:**
- Modify: `components/skill-filters.tsx`
- Modify: `app/api/skills/route.ts`
- Modify: `app/skills/page.tsx`

- [ ] **Step 7.1: 读取 skill-filters.tsx 和 api/skills/route.ts 的当前内容**

读取：
- `components/skill-filters.tsx`
- `app/api/skills/route.ts`
- `app/skills/page.tsx`

- [ ] **Step 7.2: 更新 app/api/skills/route.ts — 新增 grade 筛选**

在现有 `GET` handler 中找到 `where` 构建逻辑，新增 grade 过滤（在 `status: 'PUBLISHED'` 之后）：

```typescript
// 在 where 对象中添加（保留其他现有字段不变）
const grade = searchParams.get('grade')
// ...
const where = {
  status: 'PUBLISHED' as const,
  ...(categorySlug && { category: { slug: categorySlug } }),
  ...(type && { type: type as SkillType }),
  ...(ai && { compatibleAi: { has: ai } }),
  ...(q && {
    OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
    ],
  }),
  ...(grade && grade !== 'ALL' && { securityGrade: grade as SecurityGrade }),
}
```

在文件顶部 import 中添加 `SecurityGrade`：
```typescript
import { SkillStatus, SkillType, SecurityGrade } from '@prisma/client'
```

- [ ] **Step 7.3: 在 skill-filters.tsx 中新增 Grade 筛选器**

读取当前 `skill-filters.tsx`，在现有筛选器后追加 Grade 筛选（保持现有逻辑）：

```tsx
{/* Grade 筛选器 - 新增 */}
<div>
  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
    安全等级
  </label>
  <div className="flex gap-1 flex-wrap">
    {[
      { value: 'ALL', label: '全部' },
      { value: 'A', label: '✓ A' },
      { value: 'B', label: 'B' },
      { value: 'C', label: 'C' },
    ].map(({ value, label }) => (
      <button
        key={value}
        onClick={() => updateFilter('grade', value === 'ALL' ? null : value)}
        className={`text-xs px-2 py-1 border transition-colors ${
          (grade ?? 'ALL') === value
            ? 'bg-brand text-white border-brand'
            : 'border-border hover:border-foreground'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>
```

在组件内从 `searchParams` 中读取 `grade`：
```typescript
const grade = searchParams.grade ?? null
```

- [ ] **Step 7.4: 更新 app/skills/page.tsx — Grade 查询传递**

读取 `app/skills/page.tsx`，确保在构建 API 请求 URL 时包含 `grade` 参数：

在 `searchParams` 的解构中添加 `grade`：
```typescript
const { category, type, ai, sort, q, grade } = searchParams
```

在 fetch URL 构建处添加：
```typescript
if (grade) params.set('grade', grade)
```

并将 `grade` 传给 `SkillFilters` 组件：
```tsx
<SkillFilters
  categories={categories}
  searchParams={searchParams}
/>
```

- [ ] **Step 7.5: 验证列表页 Grade 筛选**

```bash
npm run dev
```

访问 `http://localhost:3000/skills`，点击 Grade A 筛选，确认 URL 变为 `?grade=A` 且卡片只显示 Grade A。

- [ ] **Step 7.6: 提交**

```bash
git add components/skill-filters.tsx app/api/skills/route.ts app/skills/page.tsx
git commit -m "feat: Skills 列表页新增 Grade 安全等级筛选器"
```

---

## Task 8: InstallTabs 组件（一键安装命令）

**Files:**
- Create: `components/install-tabs.tsx`

- [ ] **Step 8.1: 创建 install-tabs.tsx**

```tsx
// components/install-tabs.tsx
'use client'

import { useState } from 'react'
import { Copy, Check, Terminal, FileText, Download } from 'lucide-react'

interface InstallTabsProps {
  skillId: string
  slug?: string
  content: string | null
  fileUrl?: string | null
}

type Tab = 'command' | 'copy' | 'download'

export function InstallTabs({ skillId, slug, content, fileUrl }: InstallTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('command')
  const [copied, setCopied] = useState(false)

  const slugOrId = slug ?? skillId
  const command = `/install-skill hrskillshub/${slugOrId}`

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级方案
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleDownload() {
    // 记录下载统计
    await fetch(`/api/skills/${skillId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installType: 'DOWNLOAD_FILE' }),
    })
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  const tabs = [
    { id: 'command' as Tab, label: 'Claude Code', icon: Terminal },
    { id: 'copy' as Tab, label: '复制内容', icon: FileText },
    { id: 'download' as Tab, label: '下载文件', icon: Download },
  ]

  return (
    <div className="border border-border">
      {/* Tab 头 */}
      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-r border-border last:border-r-0 transition-colors ${
              activeTab === id
                ? 'bg-foreground text-background'
                : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="p-4 bg-card">
        {activeTab === 'command' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              在 Claude Code 中执行以下命令安装此 Skill：
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-[var(--hero-bg)] px-4 py-3 border border-border overflow-x-auto">
                {command}
              </code>
              <button
                onClick={() => handleCopy(command)}
                className="flex items-center gap-1.5 px-3 py-3 border border-border text-sm hover:border-brand hover:text-brand transition-colors whitespace-nowrap"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? '已复制 ✓' : '复制'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'copy' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              直接复制 Skill 原始内容：
            </p>
            {content ? (
              <div className="flex items-start gap-2">
                <pre className="flex-1 text-xs font-mono bg-[var(--hero-bg)] px-4 py-3 border border-border overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {content.slice(0, 500)}{content.length > 500 ? '…' : ''}
                </pre>
                <button
                  onClick={() => handleCopy(content)}
                  className="flex items-center gap-1.5 px-3 py-3 border border-border text-sm hover:border-brand hover:text-brand transition-colors whitespace-nowrap"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copied ? '已复制 ✓' : '复制全部'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无可复制的文本内容</p>
            )}
          </div>
        )}

        {activeTab === 'download' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              下载 Skill 文件（.md 或 .zip）：
            </p>
            {fileUrl ? (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-medium hover:bg-brand transition-colors"
              >
                <Download size={14} />
                下载文件
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">此 Skill 暂无可下载文件</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: 提交**

```bash
git add components/install-tabs.tsx
git commit -m "feat: 添加 InstallTabs 一键安装组件（Claude Code / 复制 / 下载）"
```

---

## Task 9: 版本历史 API + 组件

**Files:**
- Create: `app/api/skills/[id]/versions/route.ts`
- Create: `components/version-history.tsx`

- [ ] **Step 9.1: 创建版本历史 API**

```typescript
// app/api/skills/[id]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const versions = await db.skillVersion.findMany({
    where: { skillId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(versions)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = await params
  const skill = await db.skill.findUnique({ where: { id } })
  if (!skill) return NextResponse.json({ error: '不存在' }, { status: 404 })
  if (skill.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { version, changelog } = await req.json()
  if (!version || !changelog) {
    return NextResponse.json({ error: '版本号和更新说明不能为空' }, { status: 400 })
  }

  const skillVersion = await db.skillVersion.create({
    data: { skillId: id, version, changelog },
  })

  return NextResponse.json(skillVersion, { status: 201 })
}
```

- [ ] **Step 9.2: 创建版本历史组件**

```tsx
// components/version-history.tsx
import { db } from '@/lib/db'
import { Tag } from 'lucide-react'

interface VersionHistoryProps {
  skillId: string
}

export async function VersionHistory({ skillId }: VersionHistoryProps) {
  const versions = await db.skillVersion.findMany({
    where: { skillId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  if (versions.length === 0) return null

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <Tag size={14} />
          版本历史
        </h3>
      </div>
      <div className="divide-y divide-border">
        {versions.map((v) => (
          <div key={v.id} className="px-4 py-3 flex items-start gap-4">
            <span className="font-mono text-xs bg-[var(--hero-bg)] border border-border px-2 py-0.5 whitespace-nowrap mt-0.5">
              {v.version}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{v.changelog}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(v.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9.3: 提交**

```bash
git add app/api/skills/[id]/versions/route.ts components/version-history.tsx
git commit -m "feat: 添加版本历史 API 和组件"
```

---

## Task 10: 相关推荐 API + 组件

**Files:**
- Create: `app/api/skills/[id]/related/route.ts`
- Create: `components/related-skills.tsx`

- [ ] **Step 10.1: 创建相关推荐 API**

```typescript
// app/api/skills/[id]/related/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const skill = await db.skill.findUnique({
    where: { id },
    select: { categoryId: true },
  })

  if (!skill) return NextResponse.json({ error: '不存在' }, { status: 404 })

  const related = await db.skill.findMany({
    where: {
      categoryId: skill.categoryId,
      status: 'PUBLISHED',
      id: { not: id },
    },
    include: {
      category: true,
      author: { select: { nickname: true } },
    },
    orderBy: { installCount: 'desc' },
    take: 3,
  })

  return NextResponse.json(related)
}
```

- [ ] **Step 10.2: 创建相关推荐组件**

```tsx
// components/related-skills.tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import { GradeBadge } from './grade-badge'
import { Download } from 'lucide-react'

interface RelatedSkillsProps {
  skillId: string
  categoryId: string
}

export async function RelatedSkills({ skillId, categoryId }: RelatedSkillsProps) {
  const related = await db.skill.findMany({
    where: {
      categoryId,
      status: 'PUBLISHED',
      id: { not: skillId },
    },
    include: {
      category: true,
      author: { select: { nickname: true } },
    },
    orderBy: { installCount: 'desc' },
    take: 3,
  })

  if (related.length === 0) return null

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h3 className="font-heading text-sm font-black uppercase tracking-tight">相关 Skills</h3>
      </div>
      <div className="divide-y divide-border">
        {related.map((skill) => (
          <Link
            key={skill.id}
            href={`/skills/${skill.id}`}
            className="block px-4 py-3 hover:bg-[var(--hero-bg)] transition-colors group"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-sm font-medium group-hover:text-brand transition-colors line-clamp-2">
                {skill.title}
              </span>
              <GradeBadge grade={skill.securityGrade} size="sm" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Download size={10} />
              <span>{skill.installCount.toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 10.3: 提交**

```bash
git add app/api/skills/[id]/related/route.ts components/related-skills.tsx
git commit -m "feat: 添加相关推荐 API 和组件（同分类按安装数排序）"
```

---

## Task 11: SecurityPanel 组件

**Files:**
- Create: `components/security-panel.tsx`

- [ ] **Step 11.1: 创建 SecurityPanel 组件**

```tsx
// components/security-panel.tsx
import { SecurityGrade } from '@prisma/client'
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface SecurityNote {
  category: string
  severity: 'low' | 'medium' | 'high'
  description: string
  passed: boolean
}

interface SecurityPanelProps {
  grade: SecurityGrade
  score: number | null
  notes: unknown
}

const threatCategories = [
  '提示词注入',
  '凭据盗取',
  '数据外泄',
  '代码执行',
  'Unicode 隐藏指令',
  '混淆/编码',
  '权限提升',
  '供应链攻击',
  '语义操纵',
  '行为控制',
]

const gradeDisplay = {
  A: { label: 'Grade A', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  B: { label: 'Grade B', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: AlertTriangle },
  C: { label: 'Grade C', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: XCircle },
  PENDING: { label: '待评级', color: 'text-muted-foreground', bg: 'bg-[var(--hero-bg)]', icon: Shield },
}

export function SecurityPanel({ grade, score, notes }: SecurityPanelProps) {
  const display = gradeDisplay[grade]
  const Icon = display.icon
  const securityNotes = Array.isArray(notes) ? (notes as SecurityNote[]) : []

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <Shield size={14} />
          安全评级
        </h3>
      </div>

      <div className={`p-4 ${display.bg}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon size={24} className={display.color} />
          <div>
            <div className={`font-heading text-xl font-black ${display.color}`}>
              {display.label}
            </div>
            {score !== null && (
              <div className="text-xs text-muted-foreground">
                安全分数：{score}/100
              </div>
            )}
          </div>
        </div>

        {grade === 'PENDING' && (
          <p className="text-xs text-muted-foreground">扫描进行中或尚未触发</p>
        )}
      </div>

      {securityNotes.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          {securityNotes.slice(0, 5).map((note, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-2 text-xs">
              {note.passed ? (
                <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-muted-foreground">{note.category || note.description}</span>
            </div>
          ))}
        </div>
      )}

      {securityNotes.length === 0 && grade !== 'PENDING' && (
        <div className="px-4 py-3 border-t border-border">
          <div className="space-y-1.5">
            {threatCategories.slice(0, 5).map((cat) => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <CheckCircle size={10} className="text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 11.2: 提交**

```bash
git add components/security-panel.tsx
git commit -m "feat: 添加 SecurityPanel 安全评级详情面板组件"
```

---

## Task 12: Skill 详情页完全重构

**Files:**
- Modify: `app/skills/[id]/page.tsx`

- [ ] **Step 12.1: 读取当前详情页**

读取 `app/skills/[id]/page.tsx` 确认当前结构。

- [ ] **Step 12.2: 完整替换详情页**

```tsx
// app/skills/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { GradeBadge } from '@/components/grade-badge'
import { InstallTabs } from '@/components/install-tabs'
import { VersionHistory } from '@/components/version-history'
import { RelatedSkills } from '@/components/related-skills'
import { SecurityPanel } from '@/components/security-panel'
import { FavoriteButton } from '@/components/favorite-button'
import { CommentSection } from '@/components/comment-section'
import { Download, Star, User, ChevronRight, Tag } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const skill = await db.skill.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { id: true, nickname: true, avatarUrl: true } },
      _count: { select: { comments: true, favorites: true } },
    },
  })

  if (!skill) notFound()

  const avgRatingResult = await db.comment.aggregate({
    where: { skillId: id },
    _avg: { rating: true },
    _count: { rating: true },
  })

  const userFavorited = session?.user?.id
    ? !!(await db.favorite.findUnique({
        where: { userId_skillId: { userId: session.user.id, skillId: id } },
      }))
    : false

  const avgRating = avgRatingResult._avg.rating?.toFixed(1) ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
        <ChevronRight size={12} />
        <Link href="/skills" className="hover:text-foreground transition-colors">Skills</Link>
        <ChevronRight size={12} />
        <span className="text-foreground">{skill.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== 主栏 ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* 徽章行 */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/skills?category=${skill.category.slug}`}
              className="text-xs font-mono uppercase tracking-wider border border-border px-2 py-1 hover:border-brand hover:text-brand transition-colors"
            >
              {skill.category.name}
            </Link>
            <span className="text-xs font-mono border border-border px-2 py-1 text-muted-foreground">
              {skill.type === 'CLAUDE_SKILL' ? 'Claude Skill' : 'Prompt'}
            </span>
            <GradeBadge grade={skill.securityGrade} size="sm" />
            <span className="text-xs font-mono text-muted-foreground">
              v{skill.version}
            </span>
          </div>

          {/* 标题 + 描述 */}
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight mb-3">
              {skill.title}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {skill.description}
            </p>
          </div>

          {/* 统计行 */}
          <div className="flex items-center gap-6 text-sm border-y border-border py-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Download size={14} />
              {skill.installCount.toLocaleString()} 次安装
            </span>
            {avgRating && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star size={14} />
                {avgRating} / 5 ({avgRatingResult._count.rating} 条评价)
              </span>
            )}
            {session?.user?.id && (
              <FavoriteButton
                skillId={id}
                initialFavorited={userFavorited}
                favoriteCount={skill._count.favorites}
              />
            )}
          </div>

          {/* 安装方式 */}
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-tight mb-3">
              安装方式
            </h2>
            <InstallTabs
              skillId={id}
              content={skill.content}
              fileUrl={skill.fileUrl}
            />
          </div>

          {/* Skill 内容预览 */}
          {skill.content && (
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)] flex items-center justify-between">
                <h2 className="font-heading text-sm font-black uppercase tracking-tight">
                  内容预览
                </h2>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                {skill.content.slice(0, 1000)}
                {skill.content.length > 1000 && (
                  <span className="block mt-2 text-xs text-muted-foreground">
                    …（完整内容通过安装获取）
                  </span>
                )}
              </pre>
            </div>
          )}

          {/* 版本历史 */}
          <VersionHistory skillId={id} />

          {/* 评论 */}
          <CommentSection skillId={id} />
        </div>

        {/* ===== 侧栏 ===== */}
        <div className="space-y-4">
          {/* 作者信息 */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
              <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <User size={14} />
                作者
              </h3>
            </div>
            <div className="p-4">
              <Link
                href={`/authors/${skill.author.id}`}
                className="flex items-center gap-3 hover:text-brand transition-colors group"
              >
                <div className="w-10 h-10 bg-[var(--hero-bg)] border border-border flex items-center justify-center text-sm font-heading font-black">
                  {skill.author.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium group-hover:text-brand transition-colors">
                    {skill.author.nickname}
                  </div>
                  <div className="text-xs text-muted-foreground">查看主页 →</div>
                </div>
              </Link>
            </div>
          </div>

          {/* 安全评级 */}
          <SecurityPanel
            grade={skill.securityGrade}
            score={skill.securityScore}
            notes={skill.securityNotes}
          />

          {/* 兼容 AI */}
          {skill.compatibleAi.length > 0 && (
            <div className="border border-border">
              <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
                <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
                  <Tag size={14} />
                  兼容 AI
                </h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {skill.compatibleAi.map((ai) => (
                  <span
                    key={ai}
                    className="text-xs font-mono border border-border px-2 py-1 text-muted-foreground"
                  >
                    {ai}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 相关推荐 */}
          <RelatedSkills skillId={id} categoryId={skill.categoryId} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.3: 验证详情页**

```bash
npm run dev
```

访问任一 Published Skill 的详情页，确认：
- 面包屑正确
- 三列安装 Tab 可用（Claude Code / 复制 / 下载）
- 右侧侧栏显示安全评级
- 相关推荐显示

- [ ] **Step 12.4: 提交**

```bash
git add app/skills/[id]/page.tsx
git commit -m "feat: 完全重构 Skill 详情页 - 两栏布局、InstallTabs、版本历史、安全面板、相关推荐"
```

---

## Task 13: 作者信息 API

**Files:**
- Create: `app/api/authors/[username]/route.ts`
- Create: `app/api/authors/[username]/skills/route.ts`

- [ ] **Step 13.1: 创建作者信息 API**

```typescript
// app/api/authors/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  // username 可以是 user ID 或 nickname（先尝试 ID）
  const user = await db.user.findFirst({
    where: {
      OR: [{ id: username }, { nickname: username }],
    },
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          skills: { where: { status: 'PUBLISHED' } },
          followedBy: true,
          following: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  // 总安装量
  const installAgg = await db.skill.aggregate({
    where: { authorId: user.id, status: 'PUBLISHED' },
    _sum: { installCount: true },
  })

  // 平均评分
  const ratingAgg = await db.comment.aggregate({
    where: { skill: { authorId: user.id, status: 'PUBLISHED' } },
    _avg: { rating: true },
  })

  return NextResponse.json({
    ...user,
    totalInstalls: installAgg._sum.installCount ?? 0,
    avgRating: ratingAgg._avg.rating?.toFixed(1) ?? null,
  })
}
```

- [ ] **Step 13.2: 创建作者 Skills API**

```typescript
// app/api/authors/[username]/skills/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  const user = await db.user.findFirst({
    where: { OR: [{ id: username }, { nickname: username }] },
    select: { id: true },
  })

  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const skills = await db.skill.findMany({
    where: { authorId: user.id, status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { nickname: true } },
    },
    orderBy: { installCount: 'desc' },
  })

  return NextResponse.json(skills)
}
```

- [ ] **Step 13.3: 提交**

```bash
git add app/api/authors/[username]/route.ts app/api/authors/[username]/skills/route.ts
git commit -m "feat: 添加作者信息和 Skills 列表 API"
```

---

## Task 14: 关注功能 API + FollowButton 组件

**Files:**
- Create: `app/api/users/[id]/follow/route.ts`
- Create: `components/follow-button.tsx`

- [ ] **Step 14.1: 创建关注/取消关注 API**

```typescript
// app/api/users/[id]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id: targetId } = await params
  if (targetId === session.user.id) {
    return NextResponse.json({ error: '不能关注自己' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id: targetId } })
  if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetId,
      },
    },
  })

  if (existing) {
    // 已关注 → 取消关注
    await db.follow.delete({ where: { id: existing.id } })
    const count = await db.follow.count({ where: { followingId: targetId } })
    return NextResponse.json({ following: false, followerCount: count })
  } else {
    // 未关注 → 关注
    await db.follow.create({
      data: { followerId: session.user.id, followingId: targetId },
    })
    const count = await db.follow.count({ where: { followingId: targetId } })
    return NextResponse.json({ following: true, followerCount: count })
  }
}
```

- [ ] **Step 14.2: 创建 FollowButton 组件**

```tsx
// components/follow-button.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  targetUserId: string
  initialFollowing: boolean
  initialFollowerCount: number
  isLoggedIn: boolean
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowerCount,
  isLoggedIn,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFollow() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error('请求失败')
      const data = await res.json()
      setFollowing(data.following)
      setFollowerCount(data.followerCount)
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium border transition-colors ${
        following
          ? 'border-brand text-brand hover:bg-brand hover:text-white'
          : 'border-foreground bg-foreground text-background hover:bg-brand hover:border-brand'
      } disabled:opacity-50`}
    >
      {loading ? '…' : following ? `已关注 (${followerCount})` : `关注 (${followerCount})`}
    </button>
  )
}
```

- [ ] **Step 14.3: 提交**

```bash
git add app/api/users/[id]/follow/route.ts components/follow-button.tsx
git commit -m "feat: 添加关注/取消关注 API 和 FollowButton 组件"
```

---

## Task 15: 作者主页

**Files:**
- Create: `app/authors/[username]/page.tsx`

- [ ] **Step 15.1: 创建作者主页**

```tsx
// app/authors/[username]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { SkillCard } from '@/components/skill-card'
import { FollowButton } from '@/components/follow-button'
import { GradeBadge } from '@/components/grade-badge'
import { Download, Star, Users, BookOpen, Calendar } from 'lucide-react'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function AuthorPage({ params }: PageProps) {
  const { username } = await params
  const session = await auth()

  const user = await db.user.findFirst({
    where: { OR: [{ id: username }, { nickname: username }] },
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          skills: { where: { status: 'PUBLISHED' } },
          followedBy: true,
        },
      },
    },
  })

  if (!user) notFound()

  const [skills, installAgg, ratingAgg] = await Promise.all([
    db.skill.findMany({
      where: { authorId: user.id, status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { nickname: true } },
      },
      orderBy: { installCount: 'desc' },
    }),
    db.skill.aggregate({
      where: { authorId: user.id, status: 'PUBLISHED' },
      _sum: { installCount: true },
    }),
    db.comment.aggregate({
      where: { skill: { authorId: user.id, status: 'PUBLISHED' } },
      _avg: { rating: true },
    }),
  ])

  const totalInstalls = installAgg._sum.installCount ?? 0
  const avgRating = ratingAgg._avg.rating?.toFixed(1) ?? null

  // 检查当前登录用户是否关注了该作者
  const isFollowing = session?.user?.id
    ? !!(await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      }))
    : false

  // 近期活动（最新 5 条已发布 Skills）
  const recentActivity = await db.skill.findMany({
    where: { authorId: user.id, status: 'PUBLISHED' },
    select: { id: true, title: true, publishedAt: true, createdAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 5,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ===== 英雄区 ===== */}
      <section className="border border-border p-8 mb-8 bg-[var(--hero-bg)]">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* 头像 */}
          <div className="w-20 h-20 bg-foreground text-background flex items-center justify-center text-3xl font-heading font-black border border-border flex-shrink-0">
            {user.nickname.charAt(0).toUpperCase()}
          </div>

          {/* 信息 */}
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-black tracking-tight mb-1">
              {user.nickname}
            </h1>
            <p className="text-sm font-mono text-muted-foreground mb-2">@{user.id.slice(0, 8)}</p>
            {user.bio && (
              <p className="text-sm text-muted-foreground max-w-lg mb-3">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* 关注按钮 */}
          {session?.user?.id !== user.id && (
            <FollowButton
              targetUserId={user.id}
              initialFollowing={isFollowing}
              initialFollowerCount={user._count.followedBy}
              isLoggedIn={!!session?.user?.id}
            />
          )}
        </div>
      </section>

      {/* ===== 统计数字 ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-8">
        {[
          { value: user._count.skills, label: '发布 Skills', icon: BookOpen },
          {
            value: totalInstalls >= 1000 ? `${(totalInstalls / 1000).toFixed(1)}k` : totalInstalls,
            label: '总安装量',
            icon: Download,
          },
          { value: avgRating ?? '--', label: '平均评分', icon: Star },
          { value: user._count.followedBy, label: '关注者', icon: Users },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="bg-card py-6 px-4 text-center">
            <Icon size={16} className="mx-auto mb-2 text-muted-foreground" />
            <div className="font-heading text-xl font-black">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ===== 主体：Skills 网格 + 近期活动 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skills 网格 */}
        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg font-black uppercase tracking-tight mb-4">
            发布的 Skills
          </h2>
          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="border border-border p-8 text-center text-muted-foreground text-sm">
              暂无已发布的 Skills
            </div>
          )}
        </div>

        {/* 近期活动 */}
        <div>
          <h2 className="font-heading text-lg font-black uppercase tracking-tight mb-4">
            近期活动
          </h2>
          <div className="border border-border divide-y divide-border">
            {recentActivity.length > 0 ? (
              recentActivity.map((skill) => (
                <div key={skill.id} className="px-4 py-3">
                  <div className="text-xs text-muted-foreground mb-1">发布了新 Skill</div>
                  <Link
                    href={`/skills/${skill.id}`}
                    className="text-sm font-medium hover:text-brand transition-colors"
                  >
                    {skill.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(skill.publishedAt ?? skill.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                暂无活动记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 15.2: 验证作者主页**

```bash
npm run dev
```

访问 `http://localhost:3000/authors/<任意用户ID>`，确认：
- 显示作者头像首字母、昵称、统计数字
- 关注按钮可用
- Skills 网格显示
- 近期活动显示

- [ ] **Step 15.3: 提交**

```bash
git add app/authors/
git commit -m "feat: 新增作者主页 /authors/[username] - 头像、统计、Skills 网格、近期活动"
```

> **注：** spec 提到作者右侧栏（贡献分布进度条、成就徽章、擅长领域标签），这属于视觉增强，MVP 阶段用近期活动替代，后续迭代可补充。

---

## Task 15.5: 提交表单新增版本说明字段

**Files:**
- Modify: `app/submit/page.tsx`（或 `components/submit-tabs.tsx`）

- [ ] **Step 15.5.1: 读取当前提交表单**

读取 `components/submit-tabs.tsx` 或 `app/submit/page.tsx`，找到表单提交的字段列表。

- [ ] **Step 15.5.2: 在表单中添加版本号和更新说明字段**

在现有表单字段（标题、描述等）之后、提交按钮之前，添加：

```tsx
{/* 版本号 */}
<div>
  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
    版本号
  </label>
  <input
    name="version"
    type="text"
    placeholder="1.0.0"
    defaultValue="1.0.0"
    pattern="^\d+\.\d+\.\d+$"
    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors font-mono"
  />
  <p className="text-xs text-muted-foreground mt-1">格式：主版本.次版本.修订号，例如 1.0.0</p>
</div>

{/* 更新说明（仅更新时显示；首次提交可省略） */}
<div>
  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
    更新说明（可选）
  </label>
  <textarea
    name="changelog"
    rows={2}
    placeholder="描述本次版本的主要变更…"
    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors resize-none"
  />
</div>
```

- [ ] **Step 15.5.3: 在 POST /api/skills route 中保存 version 字段**

读取 `app/api/skills/route.ts` 的 POST handler，在 `db.skill.create` 的 `data` 对象中添加：

```typescript
version: body.version ?? '1.0.0',
```

- [ ] **Step 15.5.4: 提交**

```bash
git add components/submit-tabs.tsx app/api/skills/route.ts
git commit -m "feat: 提交表单新增版本号和更新说明字段"
```

---

## Task 16: 管理后台 - 安全评级设置

**Files:**
- Create: `app/api/admin/skills/[id]/grade/route.ts`
- Modify: `app/admin/skills/page.tsx`

- [ ] **Step 16.1: 创建安全评级 API**

```typescript
// app/api/admin/skills/[id]/grade/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { SecurityGrade } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { id } = await params
  const { grade, score, notes, reason } = await req.json()

  if (!Object.values(SecurityGrade).includes(grade)) {
    return NextResponse.json({ error: '无效的评级值' }, { status: 400 })
  }

  const updated = await db.skill.update({
    where: { id },
    data: {
      securityGrade: grade as SecurityGrade,
      securityScore: score ?? null,
      securityNotes: notes ?? null,
      securityOverriddenBy: session.user.id,
    },
  })

  return NextResponse.json(updated)
}
```

- [ ] **Step 16.2: 在管理后台 Skills 页添加评级设置**

读取 `app/admin/skills/page.tsx`，在每行 Skill 的操作区增加评级设置下拉：

找到 `skill-row-actions.tsx` 或直接在 `page.tsx` 的 skill 列表中，在每行操作按钮旁添加：

在 `app/admin/skills/skill-row-actions.tsx` 中（读取当前文件），追加评级设置功能：

```tsx
// 在 SkillRowActions 组件中添加以下部分（保留现有功能）

// 在组件内添加状态
const [gradeOpen, setGradeOpen] = useState(false)
const [gradeValue, setGradeValue] = useState(skill.securityGrade ?? 'PENDING')

async function handleSetGrade(grade: string) {
  const res = await fetch(`/api/admin/skills/${skill.id}/grade`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade }),
  })
  if (res.ok) {
    setGradeValue(grade)
    router.refresh()
  }
}

// 在 JSX 中添加评级下拉
<select
  value={gradeValue}
  onChange={(e) => handleSetGrade(e.target.value)}
  className="text-xs border border-border px-2 py-1 bg-background"
>
  <option value="PENDING">待评级</option>
  <option value="A">Grade A</option>
  <option value="B">Grade B</option>
  <option value="C">Grade C</option>
</select>
```

**注意**：实际修改时，先读取 `app/admin/skills/skill-row-actions.tsx` 的完整内容，再在合适位置插入上述评级下拉，不删除现有状态变更功能。

- [ ] **Step 16.3: 验证管理后台评级功能**

```bash
npm run dev
```

用管理员账号登录，访问 `/admin/skills`，确认每行有 Grade 下拉菜单，改变后页面刷新。

- [ ] **Step 16.4: 提交**

```bash
git add app/api/admin/skills/[id]/grade/route.ts app/admin/skills/skill-row-actions.tsx
git commit -m "feat: 管理后台新增安全评级设置功能（手动覆盖 Grade）"
```

---

## Task 17: i18n 国际化（next-intl）

**Files:**
- Modify: `package.json`（安装 next-intl）
- Modify: `next.config.mjs`
- Create: `middleware.ts`
- Create: `messages/zh.json`
- Create: `messages/en.json`
- Modify: `app/layout.tsx`

> **注意：** next-intl v3 要求将 `app/` 目录重构为 `app/[locale]/`（路由级 locale 前缀）。这是较大的结构变更，请在其他 Task 完成并验证后再执行本 Task。

- [ ] **Step 17.1: 安装 next-intl**

```bash
cd /Users/morphine/vibecoding/hrskillshub
npm install next-intl
```

- [ ] **Step 17.2: 创建翻译文件**

创建 `messages/zh.json`：

```json
{
  "nav": {
    "skills": "Skills",
    "authors": "作者",
    "docs": "文档",
    "submit": "提交 Skill",
    "login": "登录",
    "admin": "管理",
    "profile": "我的",
    "lang": "中 / EN"
  },
  "home": {
    "badge": "HR AI Skills Marketplace",
    "title": "发现最好的 HR AI Skills",
    "subtitle": "精选经过安全审核的 HR 提示词与技能包",
    "searchPlaceholder": "搜索 Skills，例如：面试话术、OKR 助手…",
    "searchBtn": "搜索",
    "hotTags": "热门搜索",
    "browseByCategory": "按分类浏览",
    "hotSkills": "热门 Skills",
    "viewAll": "查看全部 →",
    "stats": {
      "skills": "Skills",
      "installs": "次安装",
      "contributors": "贡献者",
      "gradeA": "Grade A"
    }
  },
  "skill": {
    "install": "安装方式",
    "claudeCode": "Claude Code",
    "copyContent": "复制内容",
    "downloadFile": "下载文件",
    "copyBtn": "复制",
    "copied": "已复制 ✓",
    "downloadBtn": "下载文件",
    "preview": "内容预览",
    "versionHistory": "版本历史",
    "security": "安全评级",
    "relatedSkills": "相关 Skills",
    "author": "作者",
    "compatibleAi": "兼容 AI",
    "installs": "次安装",
    "noFile": "此 Skill 暂无可下载文件",
    "noContent": "暂无可复制的文本内容"
  },
  "grade": {
    "A": "✓ Grade A",
    "B": "Grade B",
    "C": "Grade C",
    "PENDING": "待评级"
  },
  "author": {
    "follow": "关注",
    "following": "已关注",
    "joinedAt": "加入于",
    "publishedSkills": "发布的 Skills",
    "recentActivity": "近期活动",
    "totalInstalls": "总安装量",
    "avgRating": "平均评分",
    "followers": "关注者",
    "noSkills": "暂无已发布的 Skills",
    "noActivity": "暂无活动记录",
    "published": "发布了新 Skill"
  }
}
```

创建 `messages/en.json`：

```json
{
  "nav": {
    "skills": "Skills",
    "authors": "Authors",
    "docs": "Docs",
    "submit": "Submit Skill",
    "login": "Login",
    "admin": "Admin",
    "profile": "Profile",
    "lang": "EN / 中"
  },
  "home": {
    "badge": "HR AI Skills Marketplace",
    "title": "Discover the Best HR AI Skills",
    "subtitle": "Curated HR prompts and skill packs, security-reviewed",
    "searchPlaceholder": "Search Skills, e.g. Interview scripts, OKR assistant…",
    "searchBtn": "Search",
    "hotTags": "Popular Searches",
    "browseByCategory": "Browse by Category",
    "hotSkills": "Featured Skills",
    "viewAll": "View All →",
    "stats": {
      "skills": "Skills",
      "installs": "Installs",
      "contributors": "Contributors",
      "gradeA": "Grade A"
    }
  },
  "skill": {
    "install": "Install",
    "claudeCode": "Claude Code",
    "copyContent": "Copy Content",
    "downloadFile": "Download",
    "copyBtn": "Copy",
    "copied": "Copied ✓",
    "downloadBtn": "Download File",
    "preview": "Content Preview",
    "versionHistory": "Version History",
    "security": "Security Grade",
    "relatedSkills": "Related Skills",
    "author": "Author",
    "compatibleAi": "Compatible AI",
    "installs": "installs",
    "noFile": "No downloadable file available",
    "noContent": "No text content to copy"
  },
  "grade": {
    "A": "✓ Grade A",
    "B": "Grade B",
    "C": "Grade C",
    "PENDING": "Pending Review"
  },
  "author": {
    "follow": "Follow",
    "following": "Following",
    "joinedAt": "Joined",
    "publishedSkills": "Published Skills",
    "recentActivity": "Recent Activity",
    "totalInstalls": "Total Installs",
    "avgRating": "Avg Rating",
    "followers": "Followers",
    "noSkills": "No published Skills yet",
    "noActivity": "No recent activity",
    "published": "Published a new Skill"
  }
}
```

- [ ] **Step 17.3: 更新 next.config.mjs**

```javascript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 17.4: 创建 middleware.ts**

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'as-needed', // zh 路由不加前缀，en 加 /en 前缀
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 17.5: 将 app/ 重构为 app/[locale]/**

这是 next-intl 路由级 i18n 的必要结构变更：

```bash
# 在 app/ 下创建 [locale] 目录
mkdir -p app/\[locale\]

# 将以下文件/目录移入 [locale]/
# page.tsx, skills/, authors/, profile/, submit/, admin/
# layout.tsx 保留在 app/ 根目录（全局布局）
```

移动命令（逐个执行，保留 api/ 和 globals.css 在 app/ 根目录）：

```bash
cd /Users/morphine/vibecoding/hrskillshub/app
mv page.tsx \[locale\]/page.tsx
mv skills \[locale\]/skills
mv authors \[locale\]/authors
mv profile \[locale\]/profile
mv submit \[locale\]/submit
mv admin \[locale\]/admin
mv \(auth\) \[locale\]/\(auth\)
```

- [ ] **Step 17.6: 更新 app/[locale]/layout.tsx**

创建 `app/[locale]/layout.tsx` 作为局部布局，使用 `NextIntlClientProvider`：

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['zh', 'en']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 17.7: 在 Nav 添加语言切换按钮**

更新 `components/nav.tsx` 中的语言切换占位为实际链接：

找到注释 `{/* 语言切换（占位，Task 17 实现） */}` 并替换为：

```tsx
{/* 语言切换 */}
<div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
  <Link
    href="/"
    locale="zh"
    className="hover:text-foreground transition-colors"
  >
    中
  </Link>
  <span>/</span>
  <Link
    href="/"
    locale="en"
    className="hover:text-foreground transition-colors"
  >
    EN
  </Link>
</div>
```

（需要 `import { Link } from 'next-intl'` 替换 `import Link from 'next/link'`）

- [ ] **Step 17.8: 验证双语路由**

```bash
npm run build
npm run start
```

访问：
- `http://localhost:3000` → 中文版（默认 zh，无前缀）
- `http://localhost:3000/en` → 英文版

- [ ] **Step 17.9: 提交**

```bash
git add middleware.ts messages/ next.config.mjs app/\[locale\]/ components/nav.tsx
git commit -m "feat: 集成 next-intl 国际化 - 中英双语路由、翻译文件、语言切换"
```

---

## 最终验收清单

- [ ] 数据库迁移成功，`SkillVersion` 和 `Follow` 表存在
- [ ] 首页：英雄区 `#f5f5f5` 浅灰背景 + 网格纹理，搜索框 2px 黑色描边，分类 hover 变红（不是黑色）
- [ ] 明暗模式切换工作，`data-theme` 属性正确切换
- [ ] 导航栏顶部有 3px 红线，Logo "Skills" 为红色
- [ ] SkillCard 右上角显示 Grade 徽章，hover 显示"安装 →"红色条
- [ ] Skills 列表页 Grade 筛选器工作
- [ ] 详情页三 Tab 安装区：Claude Code 命令复制、内容复制（hover 变红）、文件下载
- [ ] 详情页右侧栏：作者信息 + 安全评级 + 兼容 AI + 相关推荐
- [ ] 版本历史组件显示（有数据时）
- [ ] 作者主页 `/authors/[id]` 正常显示，关注按钮工作
- [ ] 管理后台 Skills 页有 Grade 下拉菜单
- [ ] `/en` 路由显示英文界面（Task 17 完成后）
- [ ] 全站无圆角（`border-radius: 0`）
- [ ] 全站字体：标题 Archivo Black，正文 Space Grotesk，代码 JetBrains Mono
