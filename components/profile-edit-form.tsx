'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  initialNickname: string | null
  initialBio: string | null
  initialAvatarUrl: string | null
  displayName: string
}

export function ProfileEditForm({ initialNickname, initialBio, initialAvatarUrl, displayName }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState(initialNickname ?? '')
  const [bio, setBio] = useState(initialBio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过 2MB')
      return
    }
    setError('')
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // 上传头像（如果有新图片）
      if (avatarFile) {
        const fd = new FormData()
        fd.append('avatar', avatarFile)
        const avatarRes = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
        const avatarData = await avatarRes.json()
        if (!avatarRes.ok) {
          setError(avatarData.error ?? '头像上传失败')
          setLoading(false)
          return
        }
        setAvatarUrl(avatarData.avatarUrl)
        setAvatarFile(null)
      }

      // 更新昵称和 bio
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

  const currentAvatar = avatarPreview ?? avatarUrl

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
          <div className="bg-background border border-border w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[var(--hero-bg)] sticky top-0">
              <h2 className="font-heading text-sm font-black uppercase tracking-tight">编辑个人资料</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* 头像 */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">头像</label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 border border-border flex-shrink-0 overflow-hidden cursor-pointer relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {currentAvatar ? (
                      <Image src={currentAvatar} alt="头像" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-foreground text-background flex items-center justify-center text-xl font-heading font-black">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs opacity-0 hover:opacity-100 font-mono">更换</span>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-mono border border-border px-3 py-1.5 hover:border-brand hover:text-brand transition-colors block mb-1"
                    >
                      选择图片
                    </button>
                    <p className="text-xs text-muted-foreground">JPG / PNG / WebP，最大 2MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {avatarFile && (
                  <p className="text-xs text-brand mt-2 font-mono">已选择: {avatarFile.name}</p>
                )}
              </div>

              {/* 昵称 */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">昵称</label>
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
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">个人简介</label>
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

              {error && <p className="text-xs text-red-500 border border-red-200 bg-red-50 px-3 py-2">{error}</p>}
              {success && <p className="text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-2">保存成功！</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border py-2 text-sm hover:bg-[var(--hero-bg)] transition-colors">取消</button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand text-white py-2 text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50">
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
