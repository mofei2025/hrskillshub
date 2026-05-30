'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
}

export function UserRowActions({ user }: { user: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [email, setEmail] = useState(user.email)
  const [nickname, setNickname] = useState(user.nickname ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  const inputCls = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, string> = { email, nickname, avatarUrl, bio }
      if (newPassword) body.password = newPassword
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '保存失败'); return }
      setEditOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!confirm('确定要重置该用户的昵称、头像和个人介绍吗？')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setEditOpen(true)}
          disabled={loading}
          className="text-xs border border-gray-200 rounded px-2 py-1 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          编辑
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="text-xs border border-orange-200 rounded px-2 py-1 text-orange-500 hover:bg-orange-50 transition-colors"
        >
          重置
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-base">编辑用户信息</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>新密码（留空则不修改）</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="至少 8 位，留空不修改"
                  minLength={newPassword ? 8 : undefined}
                  className={`${inputCls} font-mono`}
                />
                <p className="text-xs text-gray-400 mt-1">密码经 bcrypt 加密存储，无法查看原密码。填写后将覆盖旧密码。</p>
              </div>

              <div>
                <label className={labelCls}>昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  maxLength={50}
                  placeholder="留空则显示邮箱"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>头像 URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>

              <div>
                <label className={labelCls}>个人介绍</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="用户个人介绍..."
                  className={`${inputCls} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1">{bio.length}/300</p>
              </div>

              {error && (
                <p className="text-sm text-red-500 border border-red-200 bg-red-50 rounded px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-gray-200 rounded py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
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
