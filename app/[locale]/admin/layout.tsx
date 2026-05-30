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
