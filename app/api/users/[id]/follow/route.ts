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

    try {
      // 先尝试创建（如果已存在会报 unique constraint）
      await db.follow.create({
        data: { followerId: session.user.id, followingId: targetId },
      })
      const count = await db.follow.count({ where: { followingId: targetId } })
      return NextResponse.json({ following: true, followerCount: count })
    } catch (createError: unknown) {
      // 检查是否是唯一约束冲突（P2002 是 Prisma 的唯一约束错误码）
      const isPrismaUniqueError =
        typeof createError === 'object' &&
        createError !== null &&
        'code' in createError &&
        (createError as { code: string }).code === 'P2002'

      if (isPrismaUniqueError) {
        // 已经关注了，执行取消关注
        await db.follow.deleteMany({
          where: { followerId: session.user.id, followingId: targetId },
        })
        const count = await db.follow.count({ where: { followingId: targetId } })
        return NextResponse.json({ following: false, followerCount: count })
      }
      throw createError // 其他错误重新抛出，由外层 try-catch 处理
    }
  } catch (error) {
    console.error('关注 API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
