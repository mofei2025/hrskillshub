'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)

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
      setError('邮箱或密码错误，请检查后重试')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleGitHub() {
    setGithubLoading(true)
    await signIn('github', { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-[var(--hero-bg)]" style={{
      backgroundImage: `linear-gradient(var(--card-border) 1px, transparent 1px), linear-gradient(90deg, var(--card-border) 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm bg-background border border-border p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="font-heading text-xl font-black tracking-tight">
              HR<span className="text-brand">Skiil</span>Hub
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">登录你的账号</p>
          </div>

          {/* GitHub 登录 */}
          <button
            type="button"
            onClick={handleGitHub}
            disabled={githubLoading}
            className="w-full flex items-center justify-center gap-3 border border-border px-4 py-3 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mb-6"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {githubLoading ? '跳转中...' : '使用 GitHub 账号登录'}
          </button>

          {/* 分隔线 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-mono text-muted-foreground uppercase">或邮箱登录</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 邮箱密码表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-brand border border-brand bg-red-50 dark:bg-red-950/30 px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-3 text-sm font-mono uppercase tracking-wider hover:bg-brand hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录 →'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            还没有账号？{' '}
            <Link href="/register" className="text-foreground underline hover:text-brand">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
