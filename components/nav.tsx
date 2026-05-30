import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ThemeToggle } from './theme-toggle'
import { SignOutButton } from './sign-out-button'

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
          HR<span className="text-brand">Skiil</span>Hub
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
          {/* 语言切换 */}
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground border-r border-border pr-3">
            <a href="/" className="hover:text-foreground transition-colors">中</a>
            <span>/</span>
            <a href="/en" className="hover:text-foreground transition-colors">EN</a>
          </div>

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
              <SignOutButton />
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
