import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const skillCount = await db.skill.count({ where: { categoryId: params.id } })
  if (skillCount > 0) {
    return NextResponse.json(
      { error: `该分类下还有 ${skillCount} 个 Skill，请先移除后再删除` },
      { status: 409 }
    )
  }

  await db.category.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
