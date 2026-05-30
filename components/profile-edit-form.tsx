'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialNickname: string | null
  initialBio: string | null
}

export function ProfileEditForm({ initialNickname, initialBio }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState(initialNickname ?? '')
  const [bio, setBio] = useState(initialBio ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, bio }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '更新失败')
      } else {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          router.refresh()
        }, 800)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono uppercase tracking-wider border border-border px-3 py-1.5 hover:border-brand hover:text-brand transition-colors"
      >
        编辑资料
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border w-full max-w-md mx-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[var(--hero-bg)]">
              <h2 className="font-heading text-sm font-black uppercase tracking-tight">编辑个人资料</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* 昵称 */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  maxLength={30}
                  placeholder="你的显示名称"
                  className="w-full border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">{nickname.length}/30</p>
              </div>

              {/* 个人简介 */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  个人简介
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={200}
                  rows={4}
                  placeholder="介绍一下你自己..."
                  className="w-full border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
              </div>

              {/* 错误/成功提示 */}
              {error && (
                <p className="text-xs text-red-500 border border-red-200 bg-red-50 px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-2">保存成功！</p>
              )}

              {/* 按钮 */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-border py-2 text-sm hover:bg-[var(--hero-bg)] transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand text-white py-2 text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
