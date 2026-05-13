import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const existing = await db.favorite.findUnique({
    where: { userId_skillId: { userId: session.user.id, skillId: params.id } },
  })

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } })
    await db.skill.update({
      where: { id: params.id },
      data: { favoriteCount: { decrement: 1 } },
    })
    return NextResponse.json({ favorited: false })
  } else {
    await db.favorite.create({
      data: { userId: session.user.id, skillId: params.id },
    })
    await db.skill.update({
      where: { id: params.id },
      data: { favoriteCount: { increment: 1 } },
    })
    return NextResponse.json({ favorited: true })
  }
}
