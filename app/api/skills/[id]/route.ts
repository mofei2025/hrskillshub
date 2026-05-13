import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const skill = await db.skill.findUnique({
    where: { id: params.id, status: 'PUBLISHED' },
    include: {
      author: { select: { nickname: true, avatarUrl: true } },
      category: { select: { name: true, slug: true } },
      comments: {
        include: { user: { select: { nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!skill) {
    return NextResponse.json({ error: '未找到该 Skill' }, { status: 404 })
  }

  return NextResponse.json({ skill })
}
