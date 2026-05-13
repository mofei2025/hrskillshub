# HRSkillsHub 实施计划一：基础架构 + 用户态功能

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 HRSkillsHub 平台的完整用户侧功能，包括浏览、注册登录、安装引导、提交 Skill、个人中心，完成后可部署上线。

**Architecture:** Next.js 14 App Router 全栈应用，PostgreSQL 数据库通过 Prisma ORM 访问，NextAuth v5 处理邮箱注册登录，shadcn/ui 提供 UI 组件，Docker Compose 统一管理本地开发和生产环境。

**Tech Stack:** Next.js 14、TypeScript、Tailwind CSS、shadcn/ui、Prisma、PostgreSQL、NextAuth v5（beta）、bcryptjs、Docker、阿里云 OSS（ali-oss）

---

## 文件结构

```
hrskillshub/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # 登录页
│   │   └── register/page.tsx       # 注册页
│   ├── skills/
│   │   ├── page.tsx                # Skills 列表页
│   │   └── [id]/page.tsx           # Skill 详情页
│   ├── submit/page.tsx             # 提交 Skill 页
│   ├── profile/page.tsx            # 用户中心页
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── register/route.ts       # 注册 API
│   │   ├── skills/
│   │   │   ├── route.ts            # GET 列表 / POST 创建
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET 详情
│   │   │       ├── favorite/route.ts   # POST 收藏/取消
│   │   │       └── download/route.ts   # POST 记录下载
│   │   ├── comments/route.ts       # POST 发表评论
│   │   └── upload/route.ts         # POST 上传 ZIP 文件
│   ├── layout.tsx                  # 根布局
│   └── page.tsx                    # 首页
├── components/
│   ├── nav.tsx                     # 顶部导航
│   ├── skill-card.tsx              # Skill 卡片组件
│   ├── skill-filters.tsx           # 筛选栏组件
│   ├── install-guide.tsx           # 三级安装引导组件
│   ├── auth-modal.tsx              # 登录弹窗（未登录时触发）
│   ├── comment-section.tsx         # 评论区组件
│   └── submit-tabs.tsx             # 提交页三种方式 Tab
├── lib/
│   ├── db.ts                       # Prisma 客户端单例
│   ├── auth.ts                     # NextAuth 配置
│   └── oss.ts                      # 阿里云 OSS 客户端
├── prisma/
│   ├── schema.prisma               # 数据库 Schema
│   └── seed.ts                     # 初始种子数据
├── types/
│   └── next-auth.d.ts              # NextAuth 类型扩展
├── docker-compose.yml              # 本地开发：PostgreSQL
├── docker-compose.prod.yml         # 生产：PostgreSQL + Next.js
├── Dockerfile                      # Next.js 镜像
├── .env.example                    # 环境变量模板
└── package.json
```

---

## Task 1：初始化 Next.js 项目

**Files:**
- Create: `package.json`（由 create-next-app 生成）
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `.env.local`

- [ ] **Step 1: 创建 Next.js 项目**

在 `/Users/morphine/vibecoding/hrskillshub` 目录下运行：

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
```

遇到询问时全部选默认（回车）。

- [ ] **Step 2: 安装依赖包**

```bash
npm install @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D prisma @types/bcryptjs
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-select
npm install lucide-react clsx tailwind-merge class-variance-authority
npm install ali-oss
npm install -D @types/ali-oss
```

- [ ] **Step 3: 初始化 shadcn/ui**

```bash
npx shadcn@latest init
```

选择：Style → Default，Base color → Slate，CSS variables → Yes

- [ ] **Step 4: 安装常用 shadcn 组件**

```bash
npx shadcn@latest add button card input label badge tabs dialog toast avatar separator
```

- [ ] **Step 5: 创建 `.env.example`**

```bash
# 数据库
DATABASE_URL="postgresql://hrskillshub:password@localhost:5432/hrskillshub"

# NextAuth
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# 平台域名（生产环境改为你的真实域名，如 https://hrskillshub.com）
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# 阿里云 OSS（上传 ZIP 文件用）
OSS_REGION="oss-cn-hangzhou"
OSS_ACCESS_KEY_ID=""
OSS_ACCESS_KEY_SECRET=""
OSS_BUCKET=""
OSS_ENDPOINT=""
```

- [ ] **Step 6: 复制 `.env.example` 为 `.env.local`，填写本地值**

```bash
cp .env.example .env.local
```

将 `AUTH_SECRET` 改为随机字符串（可以用 `openssl rand -base64 32` 生成）。

- [ ] **Step 7: 验证项目能启动**

```bash
npm run dev
```

预期：浏览器打开 http://localhost:3000 能看到 Next.js 默认页面。

---

## Task 2：Docker + 数据库 Schema

**Files:**
- Create: `docker-compose.yml`
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: 创建 `docker-compose.yml`（本地开发用）**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hrskillshub
      POSTGRES_PASSWORD: password
      POSTGRES_DB: hrskillshub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: 启动本地数据库**

```bash
docker compose up -d
```

预期：`docker compose ps` 显示 postgres 容器状态为 Up。

- [ ] **Step 3: 初始化 Prisma**

```bash
npx prisma init
```

- [ ] **Step 4: 创建 `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  password      String
  nickname      String
  role          Role       @default(USER)
  avatarUrl     String?
  createdAt     DateTime   @default(now())

  skills        Skill[]
  favorites     Favorite[]
  downloads     Download[]
  comments      Comment[]
  reviews       Review[]

  // NextAuth 需要的会话表
  sessions      Session[]
  accounts      Account[]
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
  id            String      @id @default(cuid())
  title         String
  description   String
  content       String?     @db.Text
  fileUrl       String?
  type          SkillType
  compatibleAi  String[]
  categoryId    String
  category      Category    @relation(fields: [categoryId], references: [id])
  installCount  Int         @default(0)
  favoriteCount Int         @default(0)
  downloadCount Int         @default(0)
  authorId      String
  author        User        @relation(fields: [authorId], references: [id])
  status        SkillStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  publishedAt   DateTime?

  favorites     Favorite[]
  downloads     Download[]
  comments      Comment[]
  reviews       Review[]
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

// NextAuth 需要的表
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

- [ ] **Step 5: 执行数据库迁移**

```bash
npx prisma migrate dev --name init
```

预期：终端显示 `Your database is now in sync with your schema.`

- [ ] **Step 6: 创建 `lib/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 7: 创建种子数据 `prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建默认分类
  const categories = [
    { name: '招聘', slug: 'recruitment' },
    { name: '绩效管理', slug: 'performance' },
    { name: '薪酬福利', slug: 'compensation' },
    { name: '员工关系', slug: 'employee-relations' },
    { name: '培训发展', slug: 'training' },
    { name: '人力规划', slug: 'planning' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  // 创建管理员账号
  const hashedPassword = await bcrypt.hash('admin123456', 12)
  await prisma.user.upsert({
    where: { email: 'admin@hrskillshub.com' },
    update: {},
    create: {
      email: 'admin@hrskillshub.com',
      password: hashedPassword,
      nickname: '管理员',
      role: 'ADMIN',
    },
  })

  console.log('种子数据初始化完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 8: 在 `package.json` 添加 seed 脚本，然后运行**

在 `package.json` 的 `"scripts"` 里添加：
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

安装 ts-node：
```bash
npm install -D ts-node
```

运行种子：
```bash
npx prisma db seed
```

预期：终端显示 `种子数据初始化完成`

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: 初始化项目，建立数据库 schema 和种子数据"
```

---

## Task 3：NextAuth 邮箱登录认证

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/register/route.ts`
- Create: `types/next-auth.d.ts`

- [ ] **Step 1: 创建 `lib/auth.ts`**

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
```

- [ ] **Step 2: 创建 `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 3: 创建注册 API `app/api/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email, password, nickname } = await req.json()

  if (!email || !password || !nickname) {
    return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { email, password: hashedPassword, nickname },
    select: { id: true, email: true, nickname: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
```

- [ ] **Step 4: 创建 `types/next-auth.d.ts` 扩展类型**

```typescript
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}
```

- [ ] **Step 5: 在 `.env.local` 确认 `AUTH_SECRET` 已填写**

运行以下命令生成随机密钥并填入 `.env.local`：
```bash
openssl rand -base64 32
```

将输出结果填入 `.env.local` 的 `AUTH_SECRET=` 后面。

- [ ] **Step 6: 验证注册 API**

启动 `npm run dev`，在终端运行：
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","nickname":"测试用户"}'
```

预期输出：`{"user":{"id":"...","email":"test@example.com","nickname":"测试用户"}}`

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: 添加 NextAuth 邮箱注册登录"
```

---

## Task 4：根布局 + 顶部导航

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/nav.tsx`
- Create: `components/auth-modal.tsx`

- [ ] **Step 1: 修改 `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HRSkillsHub - HR行业 AI Skills 分享平台',
  description: '专为 HR 从业者打造的 AI 提示词和 Skills 分享社区',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Nav />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: 创建 `components/nav.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Nav() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-blue-600">
          HRSkillsHub
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/skills" className="text-sm text-gray-600 hover:text-gray-900">
            浏览 Skills
          </Link>

          {session ? (
            <>
              <Link href="/submit">
                <Button size="sm">分享 Skill</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback>
                      {session.user?.name?.[0] ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">个人中心</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: 为 Nav 添加 SessionProvider，在 `app/layout.tsx` 包裹**

创建 `components/session-provider.tsx`：
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

修改 `app/layout.tsx`，在 `<body>` 内用 `<AuthProvider>` 包裹所有内容：
```typescript
import { AuthProvider } from '@/components/session-provider'

// body 内改为：
<AuthProvider>
  <Nav />
  <main>{children}</main>
  <Toaster />
</AuthProvider>
```

- [ ] **Step 4: 安装 DropdownMenu 组件**

```bash
npx shadcn@latest add dropdown-menu avatar
```

- [ ] **Step 5: 验证导航栏显示正常**

运行 `npm run dev`，访问 http://localhost:3000，确认顶部有导航栏，右侧有登录/注册按钮。

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: 添加根布局和顶部导航"
```

---

## Task 5：登录页 + 注册页

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`

- [ ] **Step 1: 创建登录页 `app/(auth)/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('邮箱或密码错误')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">登录 HRSkillsHub</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            还没有账号？{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 创建注册页 `app/(auth)/register/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">注册 HRSkillsHub</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={form.nickname}
                onChange={e => setForm({ ...form, nickname: e.target.value })}
                placeholder="你的显示名称"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码（至少 8 位）</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="请设置密码"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            已有账号？{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 安装 Card 组件（如果未安装）**

```bash
npx shadcn@latest add card
```

- [ ] **Step 4: 验证登录注册流程**

1. 访问 http://localhost:3000/register，用新邮箱注册
2. 跳转到 /login，用刚才的邮箱密码登录
3. 成功后跳转首页，导航栏右上角出现头像

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: 添加登录页和注册页"
```

---

## Task 6：Skills API（列表 + 详情）

**Files:**
- Create: `app/api/skills/route.ts`
- Create: `app/api/skills/[id]/route.ts`

- [ ] **Step 1: 创建 `app/api/skills/route.ts`（获取列表 + 创建）**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/skills - 获取 Skill 列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const ai = searchParams.get('ai')
  const sort = searchParams.get('sort') ?? 'newest'
  const q = searchParams.get('q')

  const where: any = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }
  if (type) where.type = type.toUpperCase()
  if (ai) where.compatibleAi = { has: ai }
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ]

  const orderBy: any =
    sort === 'downloads' ? { downloadCount: 'desc' }
    : sort === 'favorites' ? { favoriteCount: 'desc' }
    : sort === 'rating' ? { comments: { _count: 'desc' } }
    : { publishedAt: 'desc' }

  const skills = await db.skill.findMany({
    where,
    orderBy,
    include: {
      author: { select: { nickname: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  return NextResponse.json({ skills })
}

// POST /api/skills - 创建新 Skill
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, content, type, compatibleAi, categoryId, fileUrl } = body

  if (!title || !description || !type || !categoryId) {
    return NextResponse.json({ error: '请填写必填项' }, { status: 400 })
  }

  // 认证贡献者和管理员直接发布，普通用户进审核队列
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  const status = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN'
    ? 'PUBLISHED'
    : 'PENDING'

  const skill = await db.skill.create({
    data: {
      title,
      description,
      content,
      fileUrl,
      type: type.toUpperCase(),
      compatibleAi: compatibleAi ?? [],
      categoryId,
      authorId: session.user.id,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })

  return NextResponse.json({ skill, status }, { status: 201 })
}
```

- [ ] **Step 2: 创建 `app/api/skills/[id]/route.ts`（获取单个）**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const skill = await db.skill.findUnique({
    where: { id: params.id, status: 'PUBLISHED' },
    include: {
      author: { select: { nickname: true, avatarUrl: true } },
      category: { select: { name: true, slug: true } },
      comments: {
        include: { user: { select: { nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!skill) {
    return NextResponse.json({ error: '未找到该 Skill' }, { status: 404 })
  }

  return NextResponse.json({ skill })
}
```

- [ ] **Step 3: 创建收藏 API `app/api/skills/[id]/favorite/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const existing = await db.favorite.findUnique({
    where: { userId_skillId: { userId: session.user.id, skillId: params.id } },
  })

  if (existing) {
    // 取消收藏
    await db.favorite.delete({ where: { id: existing.id } })
    await db.skill.update({
      where: { id: params.id },
      data: { favoriteCount: { decrement: 1 } },
    })
    return NextResponse.json({ favorited: false })
  } else {
    // 添加收藏
    await db.favorite.create({
      data: { userId: session.user.id, skillId: params.id },
    })
    await db.skill.update({
      where: { id: params.id },
      data: { favoriteCount: { increment: 1 } },
    })
    return NextResponse.json({ favorited: true })
  }
}
```

- [ ] **Step 4: 创建下载记录 API `app/api/skills/[id]/download/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { installType } = await req.json()

  await db.download.create({
    data: {
      skillId: params.id,
      userId: session.user.id,
      installType: installType.toUpperCase(),
    },
  })

  await db.skill.update({
    where: { id: params.id },
    data: {
      downloadCount: { increment: 1 },
      installCount: { increment: 1 },
    },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: 创建评论 API `app/api/comments/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { skillId, content, rating } = await req.json()

  if (!skillId || !content || !rating) {
    return NextResponse.json({ error: '请填写评论内容和评分' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: '评分需在 1-5 之间' }, { status: 400 })
  }

  const comment = await db.comment.create({
    data: {
      skillId,
      userId: session.user.id,
      content,
      rating,
    },
    include: { user: { select: { nickname: true } } },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
```

- [ ] **Step 6: 验证 API**

```bash
curl http://localhost:3000/api/skills
```

预期：`{"skills":[]}`（空数组，因为还没有已发布的 skill）

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: 添加 Skills、收藏、下载、评论 API"
```

---

## Task 7：首页

**Files:**
- Modify: `app/page.tsx`
- Create: `components/skill-card.tsx`

- [ ] **Step 1: 创建 `components/skill-card.tsx`**

```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Download, Heart } from 'lucide-react'

const AI_LABELS: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  deepseek: 'DeepSeek',
  all: '通用',
}

const TYPE_LABELS: Record<string, string> = {
  PROMPT: '提示词',
  CLAUDE_SKILL: 'Claude Skill',
}

interface SkillCardProps {
  skill: {
    id: string
    title: string
    description: string
    type: string
    compatibleAi: string[]
    downloadCount: number
    favoriteCount: number
    author: { nickname: string }
    category: { name: string }
  }
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={`/skills/${skill.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{skill.title}</h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              {TYPE_LABELS[skill.type] ?? skill.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{skill.description}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="secondary" className="text-xs">{skill.category.name}</Badge>
            {skill.compatibleAi.map(ai => (
              <Badge key={ai} variant="outline" className="text-xs">
                {AI_LABELS[ai] ?? ai}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{skill.author.nickname}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {skill.downloadCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {skill.favoriteCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: 获取分类列表 API `app/api/categories/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ categories })
}
```

- [ ] **Step 3: 创建首页 `app/page.tsx`**

```typescript
import Link from 'next/link'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

async function getHomeData() {
  const [hotSkills, categories] = await Promise.all([
    db.skill.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { downloadCount: 'desc' },
      take: 6,
      include: {
        author: { select: { nickname: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: 'asc' } }),
  ])
  return { hotSkills, categories }
}

export default async function HomePage() {
  const { hotSkills, categories } = await getHomeData()

  return (
    <div>
      {/* 英雄区 */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            HR 专属的 AI Skills 分享平台
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            找到适合你的 AI 提示词和 Skills，让 DeepSeek、ChatGPT、Claude 成为你的 HR 助手
          </p>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link href="/skills" className="flex-1">
              <Button size="lg" variant="secondary" className="w-full gap-2">
                <Search className="h-4 w-4" />
                浏览所有 Skills
              </Button>
            </Link>
            <Link href="/submit">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-700">
                分享我的 Skill
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 分类入口 */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-4">按场景浏览</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Link key={cat.id} href={`/skills?category=${cat.slug}`}>
              <Button variant="outline" size="sm">{cat.name}</Button>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门 Skills */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">热门 Skills</h2>
          <Link href="/skills" className="text-sm text-blue-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        {hotSkills.length === 0 ? (
          <p className="text-gray-400 text-center py-12">还没有 Skills，快来分享第一个吧！</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: 验证首页**

访问 http://localhost:3000，确认：英雄区显示、分类标签显示、热门区显示（暂时为空）。

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: 添加首页和 SkillCard 组件"
```

---

## Task 8：Skills 列表页

**Files:**
- Create: `app/skills/page.tsx`
- Create: `components/skill-filters.tsx`

- [ ] **Step 1: 创建筛选组件 `components/skill-filters.tsx`**

```typescript
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
```

- [ ] **Step 2: 创建列表页 `app/skills/page.tsx`**

```typescript
import { Suspense } from 'react'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { SkillFilters } from '@/components/skill-filters'

async function getSkills(searchParams: Record<string, string>) {
  const { category, type, ai, sort, q } = searchParams

  const where: any = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }
  if (type) where.type = type.toUpperCase()
  if (ai) where.compatibleAi = { has: ai }
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ]

  const orderBy: any =
    sort === 'downloads' ? { downloadCount: 'desc' }
    : sort === 'favorites' ? { favoriteCount: 'desc' }
    : { publishedAt: 'desc' }

  return db.skill.findMany({
    where,
    orderBy,
    include: {
      author: { select: { nickname: true } },
      category: { select: { name: true, slug: true } },
    },
  })
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const skills = await getSkills(searchParams)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">浏览 Skills</h1>

      <Suspense>
        <SkillFilters />
      </Suspense>

      <div className="mt-6">
        {skills.length === 0 ? (
          <p className="text-gray-400 text-center py-16">没有找到匹配的 Skills</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">共 {skills.length} 个</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 验证列表页**

访问 http://localhost:3000/skills，确认筛选按钮可点击、URL 参数随之变化。

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: 添加 Skills 列表页和筛选组件"
```

---

## Task 9：Skill 详情页 + 安装引导组件

**Files:**
- Create: `app/skills/[id]/page.tsx`
- Create: `components/install-guide.tsx`
- Create: `components/comment-section.tsx`

- [ ] **Step 1: 创建安装引导组件 `components/install-guide.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, Download, Terminal } from 'lucide-react'

interface InstallGuideProps {
  skillId: string
  skillTitle: string
  content: string | null
  fileUrl: string | null
  type: string
}

export function InstallGuide({ skillId, skillTitle, content, fileUrl, type }: InstallGuideProps) {
  const { data: session } = useSession()
  const [copied, setCopied] = useState<string | null>(null)

  async function recordDownload(installType: string) {
    await fetch(`/api/skills/${skillId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installType }),
    })
  }

  async function handleCopy(text: string, key: string, installType: string) {
    await navigator.clipboard.writeText(text)
    await recordDownload(installType)
    setCopied(key)
    setTimeout(() => setCopied(null), 3000)
  }

  function LoginPrompt() {
    return (
      <a href="/login" className="text-blue-600 text-sm hover:underline">
        登录后使用
      </a>
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const installCommand = `curl -fsSL ${siteUrl}/api/skills/${skillId}/install | bash`

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">如何使用</h2>

      {/* 第一级：复制提示词 */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-green-100 text-green-700 border-green-200">简单</Badge>
          <span className="font-medium">① 直接复制提示词</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          适合所有人，粘贴到 DeepSeek、ChatGPT、Claude 等任意 AI 对话框即可使用
        </p>
        {content ? (
          <div className="bg-gray-50 rounded p-3 text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto mb-2">
            {content.slice(0, 200)}{content.length > 200 ? '...' : ''}
          </div>
        ) : null}
        {session ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => content && handleCopy(content, 'prompt', 'copy_prompt')}
            disabled={!content}
            className="gap-2"
          >
            {copied === 'prompt' ? <><Check className="h-4 w-4" />已复制</> : <><Copy className="h-4 w-4" />复制提示词</>}
          </Button>
        ) : <LoginPrompt />}
      </div>

      {/* 第二级：Claude Code 安装命令（仅 claude_skill 类型显示） */}
      {type === 'CLAUDE_SKILL' && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">中级</Badge>
            <span className="font-medium">② Claude Code 一键安装</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            适合已安装 Claude Code 的用户。复制命令后，打开电脑的终端（Mac：按 Command+空格 搜索「终端」）粘贴执行。
          </p>
          <div className="bg-gray-900 text-green-400 rounded p-3 text-sm font-mono mb-2 flex items-center justify-between">
            <span>{installCommand}</span>
          </div>
          {session ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(installCommand, 'command', 'copy_command')}
              className="gap-2"
            >
              {copied === 'command' ? <><Check className="h-4 w-4" />已复制</> : <><Terminal className="h-4 w-4" />复制安装命令</>}
            </Button>
          ) : <LoginPrompt />}
        </div>
      )}

      {/* 第三级：手动下载 */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">进阶</Badge>
          <span className="font-medium">{type === 'CLAUDE_SKILL' ? '③' : '②'} 手动下载安装</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          适合想完全掌控文件位置的用户。下载后按照说明放到指定目录。
        </p>
        {session ? (
          fileUrl ? (
            <a href={fileUrl} onClick={() => recordDownload('download_file')}>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />下载文件
              </Button>
            </a>
          ) : content ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([content], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${skillTitle}.md`
                a.click()
                recordDownload('download_file')
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />下载文件
            </Button>
          ) : (
            <p className="text-sm text-gray-400">暂无可下载文件</p>
          )
        ) : <LoginPrompt />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建评论区组件 `components/comment-section.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'

interface Comment {
  id: string
  content: string
  rating: number
  createdAt: string
  user: { nickname: string }
}

interface CommentSectionProps {
  skillId: string
  initialComments: Comment[]
}

export function CommentSection({ skillId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, content, rating }),
    })

    if (res.ok) {
      const { comment } = await res.json()
      setComments([comment, ...comments])
      setContent('')
      setRating(5)
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">用户评价（{comments.length}）</h2>

      {session && (
        <form onSubmit={handleSubmit} className="mb-6 border rounded-lg p-4">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                className={`h-5 w-5 cursor-pointer ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(n)}
              />
            ))}
          </div>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="分享你的使用体验..."
            className="mb-2"
            required
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? '提交中...' : '发表评价'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">还没有评价，登录后发表第一条吧</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{c.user.nickname}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`h-3 w-3 ${n <= c.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 安装 Textarea 组件**

```bash
npx shadcn@latest add textarea
```

- [ ] **Step 4: 创建详情页 `app/skills/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InstallGuide } from '@/components/install-guide'
import { CommentSection } from '@/components/comment-section'
import { FavoriteButton } from '@/components/favorite-button'
import { Download, Heart } from 'lucide-react'

const AI_LABELS: Record<string, string> = {
  claude: 'Claude', chatgpt: 'ChatGPT', deepseek: 'DeepSeek', all: '通用',
}

async function getSkill(id: string) {
  return db.skill.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      author: { select: { nickname: true } },
      category: { select: { name: true } },
      comments: {
        include: { user: { select: { nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const skill = await getSkill(params.id)
  if (!skill) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{skill.title}</h1>
          <FavoriteButton skillId={skill.id} initialCount={skill.favoriteCount} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
          <span>{skill.author.nickname}</span>
          <span>·</span>
          <Badge variant="secondary">{skill.category.name}</Badge>
          {skill.compatibleAi.map(ai => (
            <Badge key={ai} variant="outline">{AI_LABELS[ai] ?? ai}</Badge>
          ))}
        </div>
        <p className="text-gray-600">{skill.description}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" />{skill.downloadCount} 次使用
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />{skill.favoriteCount} 次收藏
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      <InstallGuide
        skillId={skill.id}
        skillTitle={skill.title}
        content={skill.content}
        fileUrl={skill.fileUrl}
        type={skill.type}
      />

      {skill.content && (
        <>
          <Separator className="my-6" />
          <div>
            <h2 className="text-lg font-semibold mb-3">完整内容预览</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
              {skill.content}
            </div>
          </div>
        </>
      )}

      <Separator className="my-6" />

      <CommentSection
        skillId={skill.id}
        initialComments={skill.comments as any}
      />
    </div>
  )
}
```

- [ ] **Step 5: 创建收藏按钮组件 `components/favorite-button.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  skillId: string
  initialCount: number
}

export function FavoriteButton({ skillId, initialCount }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!session) {
      router.push('/login')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/skills/${skillId}/favorite`, { method: 'POST' })
    const { favorited: newFavorited } = await res.json()
    setFavorited(newFavorited)
    setCount(c => newFavorited ? c + 1 : c - 1)
    setLoading(false)
  }

  return (
    <Button
      variant={favorited ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1 shrink-0"
    >
      <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
      {count}
    </Button>
  )
}
```

- [ ] **Step 6: 验证详情页**

在数据库创建一条测试 Skill（通过提交页或直接用 Prisma Studio）：
```bash
npx prisma studio
```
打开 http://localhost:5555，在 Skill 表创建一条 status=PUBLISHED 的记录。
访问 http://localhost:3000/skills/[该id]，确认详情页和安装引导正常显示。

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: 添加 Skill 详情页、安装引导组件、收藏按钮和评论区"
```

---

## Task 10：提交 Skill 页（三种方式）

**Files:**
- Create: `app/submit/page.tsx`
- Create: `components/submit-tabs.tsx`
- Create: `app/api/upload/route.ts`
- Create: `lib/oss.ts`

- [ ] **Step 1: 创建 OSS 客户端 `lib/oss.ts`**

```typescript
import OSS from 'ali-oss'

export function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
  })
}

export async function uploadToOSS(buffer: Buffer, filename: string): Promise<string> {
  const client = createOSSClient()
  const key = `skills/${Date.now()}-${filename}`
  const result = await client.put(key, buffer)
  return result.url
}
```

- [ ] **Step 2: 创建文件上传 API `app/api/upload/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToOSS } from '@/lib/oss'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: '请选择文件' }, { status: 400 })
  }

  if (!file.name.endsWith('.zip') && !file.name.endsWith('.md')) {
    return NextResponse.json({ error: '仅支持 .zip 或 .md 文件' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadToOSS(buffer, file.name)

  return NextResponse.json({ url })
}
```

- [ ] **Step 3: 创建提交页 `app/submit/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SubmitTabs } from '@/components/submit-tabs'

export default async function SubmitPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const categories = await db.category.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">分享你的 Skill</h1>
      <p className="text-gray-500 mb-6">
        选择最适合你的方式上传。普通用户提交后需经过审核才会发布。
      </p>
      <SubmitTabs categories={categories} />
    </div>
  )
}
```

- [ ] **Step 4: 创建提交 Tab 组件 `components/submit-tabs.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const AI_OPTIONS = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'ChatGPT', value: 'chatgpt' },
  { label: 'Claude', value: 'claude' },
  { label: '通用（所有 AI）', value: 'all' },
]

interface Category {
  id: string
  name: string
}

interface SubmitTabsProps {
  categories: Category[]
}

// 基础表单字段（三种方式共用）
function BaseFields({
  form,
  onChange,
  categories,
}: {
  form: any
  onChange: (key: string, value: any) => void
  categories: Category[]
}) {
  return (
    <>
      <div>
        <Label>Skill 名称 *</Label>
        <Input
          value={form.title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="例如：JD 生成助手 - 招聘专员版"
          required
        />
      </div>

      <div>
        <Label>简介描述 *</Label>
        <Textarea
          value={form.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="用一两句话说明这个 Skill 能解决什么问题、适合谁使用"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>分类 *</Label>
          <Select value={form.categoryId} onValueChange={v => onChange('categoryId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>类型 *</Label>
          <Select value={form.type} onValueChange={v => onChange('type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prompt">提示词</SelectItem>
              <SelectItem value="claude_skill">Claude Skill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>兼容 AI（可多选）</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {AI_OPTIONS.map(ai => (
            <label key={ai.value} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.compatibleAi.includes(ai.value)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...form.compatibleAi, ai.value]
                    : form.compatibleAi.filter((v: string) => v !== ai.value)
                  onChange('compatibleAi', next)
                }}
              />
              <span className="text-sm">{ai.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )
}

export function SubmitTabs({ categories }: SubmitTabsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const defaultForm = {
    title: '',
    description: '',
    categoryId: '',
    type: '',
    compatibleAi: [] as string[],
    content: '',
    fileUrl: '',
  }

  const [form, setForm] = useState(defaultForm)

  function updateForm(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      if (data.status === 'PUBLISHED') {
        router.push(`/skills/${data.skill.id}`)
      } else {
        setMessage('提交成功！我们会在审核通过后发布，请耐心等待。')
        setForm(defaultForm)
      }
    } else {
      setMessage(data.error ?? '提交失败，请重试')
    }
    setLoading(false)
  }

  async function handleFileUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const { url, error } = await res.json()
    if (error) { setMessage(error); return }
    updateForm('fileUrl', url)
    setMessage('文件上传成功！')
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="form">
        <TabsList className="mb-6">
          <TabsTrigger value="form">📝 填写表单</TabsTrigger>
          <TabsTrigger value="editor">✏️ 在线编辑</TabsTrigger>
          <TabsTrigger value="upload">📦 上传文件</TabsTrigger>
        </TabsList>

        {/* 方式一：表单 */}
        <TabsContent value="form" className="space-y-4">
          <BaseFields form={form} onChange={updateForm} categories={categories} />
          <div>
            <Label>提示词内容 *</Label>
            <Textarea
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
              placeholder="粘贴你的完整提示词内容..."
              className="min-h-[200px] font-mono"
              required
            />
          </div>
        </TabsContent>

        {/* 方式二：在线 Markdown 编辑器 */}
        <TabsContent value="editor" className="space-y-4">
          <BaseFields form={form} onChange={updateForm} categories={categories} />
          <div>
            <Label>Markdown 内容</Label>
            <p className="text-xs text-gray-400 mb-1">支持 Markdown 格式，可以加标题、代码块等</p>
            <Textarea
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
              placeholder="# Skill 名称&#10;&#10;## 使用方法&#10;&#10;## 提示词内容"
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </TabsContent>

        {/* 方式三：上传 ZIP */}
        <TabsContent value="upload" className="space-y-4">
          <BaseFields form={form} onChange={updateForm} categories={categories} />
          <div>
            <Label>上传文件（.zip 或 .md，最大 10MB）</Label>
            <input
              type="file"
              accept=".zip,.md"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {form.fileUrl && (
              <p className="text-xs text-green-600 mt-1">✓ 文件已上传</p>
            )}
          </div>
          <div>
            <Label>使用说明（描述如何触发和使用这个 Skill）</Label>
            <Textarea
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
              placeholder="说明触发词是什么、需要输入哪些参数、会输出什么..."
              className="min-h-[120px]"
            />
          </div>
        </TabsContent>
      </Tabs>

      {message && (
        <p className={`mt-4 text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      <Button type="submit" className="mt-6 w-full" disabled={loading}>
        {loading ? '提交中...' : '提交 Skill'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: 安装 Select 组件**

```bash
npx shadcn@latest add select
```

- [ ] **Step 6: 验证提交流程**

访问 http://localhost:3000/submit，用表单方式填写一个测试 Skill 并提交。
确认提交后显示"提交成功，等待审核"的提示。

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: 添加提交 Skill 页面（三种方式）和文件上传 API"
```

---

## Task 11：用户中心页

**Files:**
- Create: `app/profile/page.tsx`

- [ ] **Step 1: 创建用户中心 `app/profile/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '未通过', color: 'bg-red-100 text-red-700' },
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user, mySkills, myFavorites] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true, email: true, role: true, createdAt: true },
    }),
    db.skill.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { nickname: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        skill: {
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    }),
  ])

  if (!user) redirect('/login')

  const ROLE_LABELS: Record<string, string> = {
    USER: '普通用户',
    CONTRIBUTOR: '认证贡献者',
    ADMIN: '管理员',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 用户信息 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
          {user.nickname[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.nickname}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <Badge className="mt-1">{ROLE_LABELS[user.role]}</Badge>
        </div>
      </div>

      <Tabs defaultValue="uploads">
        <TabsList>
          <TabsTrigger value="uploads">我的上传（{mySkills.length}）</TabsTrigger>
          <TabsTrigger value="favorites">我的收藏（{myFavorites.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="mt-4">
          {mySkills.length === 0 ? (
            <p className="text-gray-400 text-center py-12">还没有上传过 Skill</p>
          ) : (
            <div className="space-y-3">
              {mySkills.map(skill => (
                <div key={skill.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <SkillCard skill={skill} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_LABELS[skill.status].color}`}>
                    {STATUS_LABELS[skill.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          {myFavorites.length === 0 ? (
            <p className="text-gray-400 text-center py-12">还没有收藏过 Skill</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myFavorites.map(({ skill }) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: 验证用户中心**

登录后访问 http://localhost:3000/profile，确认昵称、邮箱、角色正常显示，"我的上传"显示刚才提交的 Skill（状态为"审核中"）。

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: 添加用户中心页"
```

---

## Task 12：Docker 生产部署

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.prod.yml`
- Create: `.dockerignore`

- [ ] **Step 1: 创建 `Dockerfile`**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: 在 `next.config.js` 开启 standalone 输出**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

- [ ] **Step 3: 创建 `docker-compose.prod.yml`**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: hrskillshub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hrskillshub
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hrskillshub:${DB_PASSWORD}@postgres:5432/hrskillshub
      AUTH_SECRET: ${AUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      OSS_REGION: ${OSS_REGION}
      OSS_ACCESS_KEY_ID: ${OSS_ACCESS_KEY_ID}
      OSS_ACCESS_KEY_SECRET: ${OSS_ACCESS_KEY_SECRET}
      OSS_BUCKET: ${OSS_BUCKET}
    depends_on:
      - postgres

volumes:
  postgres_data:
```

- [ ] **Step 4: 创建 `.dockerignore`**

```
node_modules
.next
.env*
.git
docker-compose*.yml
README.md
```

- [ ] **Step 5: 本地验证 Docker 构建成功**

```bash
docker build -t hrskillshub .
```

预期：构建完成，无报错。

- [ ] **Step 6: 在服务器上的部署步骤（README 说明）**

创建 `DEPLOY.md`：

```markdown
# 部署说明

## 1. 服务器准备
在阿里云 ECS / 腾讯云 CVM 上安装 Docker 和 Docker Compose：
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## 2. 上传代码
```bash
git clone <你的代码仓库地址>
cd hrskillshub
```

## 3. 配置环境变量
```bash
cp .env.example .env.prod
# 编辑 .env.prod，填入正式的密钥和数据库密码
```

## 4. 启动服务
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 5. 初始化数据库
```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

## 6. 域名解析
在阿里云/腾讯云控制台，将你的域名 A 记录指向服务器 IP 地址。
```

- [ ] **Step 7: 最终构建验证**

```bash
npm run build
```

预期：Build 成功，无 TypeScript 错误。

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: 添加 Docker 生产部署配置和部署说明"
```

---

## 自检清单

完成所有 Task 后，对照设计文档检查：

- [ ] 首页：搜索入口、分类标签、热门 Skills ✓
- [ ] 列表页：筛选（分类/类型/AI）、排序（最新/下载/收藏）✓
- [ ] 详情页：三级安装引导、下载数/收藏数、评论区 ✓
- [ ] 权限：未登录只能看数量，登录才能复制/下载/收藏/评论 ✓
- [ ] 注册/登录：邮箱方式，不需要 GitHub ✓
- [ ] 提交页：表单/编辑器/ZIP 三种方式 ✓
- [ ] 用户中心：我的上传（含状态）、我的收藏 ✓
- [ ] 认证贡献者/管理员直接发布，普通用户进审核队列 ✓
- [ ] Docker 部署配置就绪 ✓
```
