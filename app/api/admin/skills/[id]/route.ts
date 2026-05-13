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

  const { status } = await req.json()
  const validStatuses = ['PENDING', 'PUBLISHED', 'REJECTED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
  }

  const skill = await db.skill.update({
    where: { id: params.id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
  })

  return NextResponse.json({ skill })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  await db.skill.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
