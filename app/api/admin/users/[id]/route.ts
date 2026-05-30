import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

  const body = await req.json()
  const { role, nickname, avatarUrl, bio, email, password, reset } = body

  // 重置 profile
  if (reset) {
    const user = await db.user.update({
      where: { id: params.id },
      data: { nickname: null, avatarUrl: null, bio: null },
      select: { id: true, email: true, nickname: true, avatarUrl: true, bio: true, role: true },
    })
    return NextResponse.json({ user })
  }

  // 修改角色
  if (role !== undefined) {
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

  // 修改 profile（含邮箱和密码）
  if (email !== undefined && !email.trim()) {
    return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
  }
  if (password !== undefined && password.length < 8) {
    return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
  }

  const data: Record<string, string | null> = {}
  if (email !== undefined) data.email = email.trim()
  if (nickname !== undefined) data.nickname = nickname || null
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null
  if (bio !== undefined) data.bio = bio || null
  if (password) data.password = await bcrypt.hash(password, 12)

  try {
    const user = await db.user.update({
      where: { id: params.id },
      data,
      select: { id: true, email: true, nickname: true, avatarUrl: true, bio: true, role: true },
    })
    return NextResponse.json({ user })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: '该邮箱已被其他用户使用' }, { status: 409 })
    }
    throw e
  }
}
