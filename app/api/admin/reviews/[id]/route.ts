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

  const { action, feedback } = await req.json()

  if (action !== 'APPROVED' && action !== 'REJECTED') {
    return NextResponse.json({ error: '无效的操作' }, { status: 400 })
  }

  const skill = await db.skill.findUnique({ where: { id: params.id } })
  if (!skill) {
    return NextResponse.json({ error: 'Skill 不存在' }, { status: 404 })
  }
  if (skill.status !== 'PENDING') {
    return NextResponse.json({ error: '该 Skill 已审核，无法重复操作' }, { status: 400 })
  }

  const newStatus = action === 'APPROVED' ? 'PUBLISHED' : 'REJECTED'

  const [updatedSkill, review] = await db.$transaction([
    db.skill.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        publishedAt: action === 'APPROVED' ? new Date() : undefined,
      },
    }),
    db.review.create({
      data: {
        skillId: params.id,
        adminId: session.user.id,
        action,
        feedback: feedback ?? null,
      },
    }),
  ])

  return NextResponse.json({ skill: updatedSkill, review })
}
