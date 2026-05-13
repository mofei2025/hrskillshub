# HRSkillsHub 实施计划二：管理后台

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 HRSkillsHub 平台搭建完整的 ADMIN 管理后台，包含审核队列、Skills 管理、用户管理、分类管理，以及统计数据首页。

**Architecture:** 使用 `app/admin/layout.tsx` 做统一权限校验和侧边导航，API 全部在 `app/api/admin/` 下，页面尽量用 Server Components，交互部分抽取为 Client Components。

**Tech Stack:** Next.js 14 App Router, Prisma 7 + PostgreSQL, NextAuth v5 beta (JWT), shadcn/ui v4, TypeScript

---

## Task 1：管理后台布局（权限校验 + 侧边导航）

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: 创建 `app/admin/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { LayoutDashboard, ClipboardList, BookOpen, Users, Tag } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: '总览', icon: LayoutDashboard },
  { href: '/admin/reviews', label: '审核队列', icon: ClipboardList },
  { href: '/admin/skills', label: 'Skills 管理', icon: BookOpen },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/categories', label: '分类管理', icon: Tag },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-52 shrink-0 border-r bg-gray-50 px-3 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          管理后台
        </p>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto px-8 py-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: 验证**

访问 http://localhost:3001/admin（非 ADMIN 账号），确认被重定向到首页。

---

## Task 2：管理后台首页（统计数据）

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: 创建 `app/admin/page.tsx`**

```tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'

async function getStats() {
  const [pendingCount, publishedCount, userCount, categoryCount] =
    await Promise.all([
      db.skill.count({ where: { status: 'PENDING' } }),
      db.skill.count({ where: { status: 'PUBLISHED' } }),
      db.user.count(),
      db.category.count(),
    ])
  return { pendingCount, publishedCount, userCount, categoryCount }
}

export default async function AdminPage() {
  const { pendingCount, publishedCount, userCount, categoryCount } =
    await getStats()

  const stats = [
    { label: '待审核 Skills', value: pendingCount, href: '/admin/reviews', urgent: pendingCount > 0 },
    { label: '已发布 Skills', value: publishedCount, href: '/admin/skills', urgent: false },
    { label: '注册用户', value: userCount, href: '/admin/users', urgent: false },
    { label: '分类总数', value: categoryCount, href: '/admin/categories', urgent: false },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台总览</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, href, urgent }) => (
          <Link key={href} href={href}>
            <div
              className={`rounded-lg border p-5 hover:shadow-sm transition-shadow cursor-pointer ${
                urgent ? 'border-amber-300 bg-amber-50' : 'bg-white'
              }`}
            >
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${urgent ? 'text-amber-600' : 'text-gray-900'}`}>
                {value}
              </p>
              {urgent && <p className="text-xs text-amber-600 mt-1">需要处理</p>}
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">快捷操作</h2>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/reviews"><Button variant="outline">查看审核队列</Button></Link>
        <Link href="/admin/skills"><Button variant="outline">管理 Skills</Button></Link>
        <Link href="/admin/users"><Button variant="outline">管理用户</Button></Link>
        <Link href="/admin/categories"><Button variant="outline">管理分类</Button></Link>
      </div>
    </div>
  )
}
```

---

## Task 3：审核队列 API

**Files:**
- Create: `app/api/admin/reviews/[id]/route.ts`

- [ ] **Step 1: 创建 `app/api/admin/reviews/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { action, feedback } = await req.json()

  if (action !== 'APPROVED' && action !== 'REJECTED') {
    return NextResponse.json({ error: '无效的操作' }, { status: 400 })
  }

  const skill = await db.skill.findUnique({ where: { id: params.id } })
  if (!skill) {
    return NextResponse.json({ error: 'Skill 不存在' }, { status: 404 })
  }
  if (skill.status !== 'PENDING') {
    return NextResponse.json({ error: '该 Skill 已审核，无法重复操作' }, { status: 400 })
  }

  const newStatus = action === 'APPROVED' ? 'PUBLISHED' : 'REJECTED'

  const [updatedSkill, review] = await db.$transaction([
    db.skill.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        publishedAt: action === 'APPROVED' ? new Date() : undefined,
      },
    }),
    db.review.create({
      data: {
        skillId: params.id,
        adminId: session.user.id,
        action,
        feedback: feedback ?? null,
      },
    }),
  ])

  return NextResponse.json({ skill: updatedSkill, review })
}
```

---

## Task 4：审核队列页面

**Files:**
- Create: `app/admin/reviews/review-actions.tsx`
- Create: `app/admin/reviews/page.tsx`

- [ ] **Step 1: 安装 Dialog 组件（如未安装）**

```bash
npx shadcn@latest add dialog --yes
```

- [ ] **Step 2: 创建 `app/admin/reviews/review-actions.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronUp } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  PROMPT: '提示词',
  CLAUDE_SKILL: 'Claude Skill',
}

interface Skill {
  id: string
  title: string
  description: string
  content: string | null
  type: string
  createdAt: Date
  author: { nickname: string; email: string }
  category: { name: string }
}

export function ReviewActions({ skill }: { skill: Skill }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function handleAction(action: 'APPROVED' | 'REJECTED') {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: feedback || undefined }),
      })
      if (res.ok) {
        setRejectOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-semibold text-gray-900 truncate">{skill.title}</h2>
            <Badge variant="outline" className="text-xs shrink-0">
              {TYPE_LABELS[skill.type] ?? skill.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mb-1">{skill.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>作者：{skill.author.nickname}（{skill.author.email}）</span>
            <span>分类：{skill.category.name}</span>
            <span>提交：{new Date(skill.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? '收起' : '查看内容'}
          </Button>
          <Button size="sm" onClick={() => handleAction('APPROVED')} disabled={loading}>
            通过
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setRejectOpen(true)} disabled={loading}>
            拒绝
          </Button>
        </div>
      </div>

      {expanded && skill.content && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto border">
          {skill.content}
        </div>
      )}
      {expanded && !skill.content && (
        <p className="mt-3 text-sm text-gray-400">（该 Skill 无文本内容，可能是文件上传方式）</p>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝理由（选填）</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="请输入拒绝理由，提交者将看到此说明..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => handleAction('REJECTED')} disabled={loading}>
              {loading ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 3: 创建 `app/admin/reviews/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { ReviewActions } from './review-actions'

async function getPendingSkills() {
  return db.skill.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { nickname: true, email: true } },
      category: { select: { name: true } },
    },
  })
}

export default async function ReviewsPage() {
  const skills = await getPendingSkills()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        审核队列
        <span className="ml-2 text-sm font-normal text-gray-500">{skills.length} 条待审核</span>
      </h1>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center text-gray-400">
          暂无待审核的 Skill，队列已清空
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => (
            <ReviewActions key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Task 5：Skills 管理 API + 页面

**Files:**
- Create: `app/api/admin/skills/[id]/route.ts`
- Create: `app/admin/skills/skill-row-actions.tsx`
- Create: `app/admin/skills/page.tsx`

- [ ] **Step 1: 创建 `app/api/admin/skills/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { status } = await req.json()
  const validStatuses = ['PENDING', 'PUBLISHED', 'REJECTED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
  }

  const skill = await db.skill.update({
    where: { id: params.id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
  })

  return NextResponse.json({ skill })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  await db.skill.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: 创建 `app/admin/skills/skill-row-actions.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SkillRowActionsProps {
  skillId: string
  currentStatus: string
}

export function SkillRowActions({ skillId, currentStatus }: SkillRowActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个 Skill 吗？此操作不可撤销。')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/skills/${skillId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">待审核</SelectItem>
          <SelectItem value="PUBLISHED">已发布</SelectItem>
          <SelectItem value="REJECTED">已拒绝</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
        删除
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: 创建 `app/admin/skills/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { SkillRowActions } from './skill-row-actions'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: '待审核', variant: 'outline' },
  PUBLISHED: { label: '已发布', variant: 'default' },
  REJECTED: { label: '已拒绝', variant: 'destructive' },
}

const TYPE_LABELS: Record<string, string> = {
  PROMPT: '提示词',
  CLAUDE_SKILL: 'Claude Skill',
}

async function getAllSkills(page: number) {
  const pageSize = 20
  const [skills, total] = await Promise.all([
    db.skill.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { nickname: true } },
        category: { select: { name: true } },
      },
    }),
    db.skill.count(),
  ])
  return { skills, total, pageSize }
}

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const { skills, total, pageSize } = await getAllSkills(page)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Skills 管理
        <span className="ml-2 text-sm font-normal text-gray-500">共 {total} 条</span>
      </h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">标题</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">分类</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">作者</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">提交时间</th>
              <th className="px-4 py-3 w-44"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {skills.map((skill) => {
              const statusCfg = STATUS_CONFIG[skill.status]
              return (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{skill.title}</td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[skill.type] ?? skill.type}</td>
                  <td className="px-4 py-3 text-gray-500">{skill.category.name}</td>
                  <td className="px-4 py-3 text-gray-500">{skill.author.nickname}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(skill.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <SkillRowActions skillId={skill.id} currentStatus={skill.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/skills?page=${page - 1}`} className="px-3 py-1 border rounded hover:bg-gray-50">上一页</a>
            )}
            {page < totalPages && (
              <a href={`/admin/skills?page=${page + 1}`} className="px-3 py-1 border rounded hover:bg-gray-50">下一页</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Task 6：用户管理 API + 页面

**Files:**
- Create: `app/api/admin/users/[id]/route.ts`
- Create: `app/admin/users/user-role-select.tsx`
- Create: `app/admin/users/page.tsx`

- [ ] **Step 1: 创建 `app/api/admin/users/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { role } = await req.json()
  const validRoles = ['USER', 'CONTRIBUTOR', 'ADMIN']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: '无效的角色值' }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: { role },
    select: { id: true, email: true, nickname: true, role: true },
  })

  return NextResponse.json({ user })
}
```

- [ ] **Step 2: 创建 `app/admin/users/user-role-select.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserRoleSelectProps {
  userId: string
  currentRole: string
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRoleChange(newRole: string) {
    if (newRole === currentRole) return
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={currentRole} onValueChange={handleRoleChange} disabled={loading}>
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USER">普通用户</SelectItem>
        <SelectItem value="CONTRIBUTOR">认证贡献者</SelectItem>
        <SelectItem value="ADMIN">管理员</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 3: 创建 `app/admin/users/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { UserRoleSelect } from './user-role-select'

async function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      createdAt: true,
      _count: { select: { skills: true } },
    },
  })
}

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        用户管理
        <span className="ml-2 text-sm font-normal text-gray-500">共 {users.length} 位</span>
      </h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">昵称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">邮箱</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">上传数</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">注册时间</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">角色</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.nickname}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-gray-500 text-center">{user._count.skills}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <UserRoleSelect userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Task 7：分类管理 API + 页面

**Files:**
- Create: `app/api/admin/categories/route.ts`
- Create: `app/api/admin/categories/[id]/route.ts`
- Create: `app/admin/categories/category-actions.tsx`
- Create: `app/admin/categories/page.tsx`

- [ ] **Step 1: 创建 `app/api/admin/categories/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { name, slug } = await req.json()

  if (!name || !slug) {
    return NextResponse.json({ error: '名称和 slug 不能为空' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'slug 只允许小写字母、数字和连字符（-）' },
      { status: 400 }
    )
  }

  try {
    const category = await db.category.create({ data: { name, slug } })
    return NextResponse.json({ category }, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: '分类名称或 slug 已存在' }, { status: 409 })
    }
    throw e
  }
}
```

- [ ] **Step 2: 创建 `app/api/admin/categories/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const skillCount = await db.skill.count({ where: { categoryId: params.id } })
  if (skillCount > 0) {
    return NextResponse.json(
      { error: `该分类下还有 ${skillCount} 个 Skill，请先移除后再删除` },
      { status: 409 }
    )
  }

  await db.category.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 创建 `app/admin/categories/category-actions.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  name: string
  slug: string
  _count: { skills: number }
}

export function CategoryActions({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!slug) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '添加失败')
        return
      }
      setName('')
      setSlug('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, skillCount: number) {
    if (skillCount > 0) {
      alert(`该分类下还有 ${skillCount} 个 Skill，无法删除`)
      return
    }
    if (!confirm('确定要删除这个分类吗？')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '删除失败')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">新增分类</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>分类名称</Label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="例如：招聘管理"
              required
            />
          </div>
          <div>
            <Label>Slug（URL 标识）</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="例如：recruitment"
              required
              pattern="[a-z0-9-]+"
              title="只允许小写字母、数字和连字符"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} size="sm">
          {loading ? '添加中...' : '添加分类'}
        </Button>
      </form>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">Skill 数</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500 text-center">{cat._count.skills}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cat.id, cat._count.skills)}
                    disabled={loading || cat._count.skills > 0}
                    title={cat._count.skills > 0 ? '有 Skill 时无法删除' : '删除分类'}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建 `app/admin/categories/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { CategoryActions } from './category-actions'

async function getCategories() {
  return db.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { skills: true } } },
  })
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        分类管理
        <span className="ml-2 text-sm font-normal text-gray-500">共 {categories.length} 个</span>
      </h1>
      <CategoryActions categories={categories} />
    </div>
  )
}
```
