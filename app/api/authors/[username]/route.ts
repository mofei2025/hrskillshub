import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await db.user.findFirst({
      where: {
        OR: [{ id: username }, { nickname: username }],
      },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            skills: { where: { status: 'PUBLISHED' } },
            followedBy: true,
            following: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const [installAgg, ratingAgg] = await Promise.all([
      db.skill.aggregate({
        where: { authorId: user.id, status: 'PUBLISHED' },
        _sum: { installCount: true },
      }),
      db.comment.aggregate({
        where: { skill: { authorId: user.id, status: 'PUBLISHED' } },
        _avg: { rating: true },
      }),
    ])

    return NextResponse.json({
      ...user,
      totalInstalls: installAgg._sum.installCount ?? 0,
      avgRating: ratingAgg._avg.rating?.toFixed(1) ?? null,
    })
  } catch (error) {
    console.error('作者 API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
