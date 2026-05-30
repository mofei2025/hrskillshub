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

  const body = await req.json()
  const { role, nickname, avatarUrl, bio, reset } = body

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

  // 修改 profile
  const data: { nickname?: string | null; avatarUrl?: string | null; bio?: string | null } = {}
  if (nickname !== undefined) data.nickname = nickname || null
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null
  if (bio !== undefined) data.bio = bio || null

  const user = await db.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, nickname: true, avatarUrl: true, bio: true, role: true },
  })

  return NextResponse.json({ user })
}
