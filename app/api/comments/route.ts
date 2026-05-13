import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { skillId, content, rating } = await req.json()

  if (!skillId || !content || !rating) {
    return NextResponse.json({ error: '请填写评论内容和评分' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: '评分需在 1-5 之间' }, { status: 400 })
  }

  const comment = await db.comment.create({
    data: {
      skillId,
      userId: session.user.id,
      content,
      rating,
    },
    include: { user: { select: { nickname: true } } },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
