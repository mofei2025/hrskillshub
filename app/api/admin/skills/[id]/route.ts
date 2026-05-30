import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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
  const { status, title, description, categoryId, content, fileUrl } = body

  const updateData: Record<string, unknown> = {}

  if (status !== undefined) {
    const validStatuses = ['PENDING', 'PUBLISHED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
    }
    updateData.status = status
    if (status === 'PUBLISHED') updateData.publishedAt = new Date()
  }
  if (title !== undefined) updateData.title = title.trim()
  if (description !== undefined) updateData.description = description.trim()
  if (categoryId !== undefined) updateData.categoryId = categoryId
  if (content !== undefined) updateData.content = content
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl || null

  const skill = await db.skill.update({
    where: { id: params.id },
    data: updateData,
  })

  revalidatePath('/skills')
  revalidatePath(`/skills/${params.id}`)
  revalidatePath('/authors')

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

  // 先删除无 Cascade 的关联记录，再删除 Skill
  await db.$transaction([
    db.favorite.deleteMany({ where: { skillId: params.id } }),
    db.download.deleteMany({ where: { skillId: params.id } }),
    db.comment.deleteMany({ where: { skillId: params.id } }),
    db.skill.delete({ where: { id: params.id } }),
  ])

  revalidatePath('/skills')
  revalidatePath('/authors')
  return NextResponse.json({ ok: true })
}
