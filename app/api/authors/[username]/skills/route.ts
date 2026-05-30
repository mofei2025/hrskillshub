import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await db.user.findFirst({
      where: { OR: [{ id: username }, { nickname: username }] },
      select: { id: true },
    })

    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const skills = await db.skill.findMany({
      where: { authorId: user.id, status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { nickname: true } },
      },
      orderBy: { installCount: 'desc' },
    })

    return NextResponse.json(skills)
  } catch (error) {
    console.error('作者 Skills API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
