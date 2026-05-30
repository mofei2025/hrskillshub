import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id: targetId } = await params
    if (targetId === session.user.id) {
      return NextResponse.json({ error: '不能关注自己' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id: targetId } })
    if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetId,
        },
      },
    })

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } })
      const count = await db.follow.count({ where: { followingId: targetId } })
      return NextResponse.json({ following: false, followerCount: count })
    } else {
      await db.follow.create({
        data: { followerId: session.user.id, followingId: targetId },
      })
      const count = await db.follow.count({ where: { followingId: targetId } })
      return NextResponse.json({ following: true, followerCount: count })
    }
  } catch (error) {
    console.error('关注 API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
