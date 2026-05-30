import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { nickname, bio } = await req.json()

    if (nickname !== undefined && typeof nickname === 'string') {
      const trimmed = nickname.trim()
      if (trimmed.length > 30) {
        return NextResponse.json({ error: '昵称不能超过 30 个字符' }, { status: 400 })
      }
      // 检查昵称是否被其他人占用
      if (trimmed) {
        const existing = await db.user.findFirst({
          where: { nickname: trimmed, NOT: { id: session.user.id } },
        })
        if (existing) {
          return NextResponse.json({ error: '该昵称已被使用' }, { status: 409 })
        }
      }
    }

    if (bio !== undefined && typeof bio === 'string' && bio.trim().length > 200) {
      return NextResponse.json({ error: '简介不能超过 200 个字符' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(nickname !== undefined ? { nickname: nickname.trim() || null } : {}),
        ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
      },
      select: { id: true, nickname: true, bio: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '更新失败，请重试' }, { status: 500 })
  }
}
