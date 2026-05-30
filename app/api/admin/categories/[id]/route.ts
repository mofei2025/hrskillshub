import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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
  revalidatePath('/skills')
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const body = await req.json()
  const { name, slug, order } = body

  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: '名称不能为空' }, { status: 400 })
  }
  if (slug !== undefined && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug 只允许小写字母、数字和连字符' }, { status: 400 })
  }

  try {
    const updated = await db.category.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
      },
    })
    revalidatePath('/skills')
    return NextResponse.json({ category: updated })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: '分类名称或 slug 已存在' }, { status: 409 })
    }
    throw e
  }
}
