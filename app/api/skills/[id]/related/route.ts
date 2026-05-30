import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skill = await db.skill.findUnique({
      where: { id },
      select: { categories: { select: { id: true } } },
    })

    if (!skill) return NextResponse.json({ error: '不存在' }, { status: 404 })

    const categoryIds = skill.categories.map((c) => c.id)

    const related = await db.skill.findMany({
      where: {
        categories: categoryIds.length ? { some: { id: { in: categoryIds } } } : undefined,
        status: 'PUBLISHED',
        id: { not: id },
      },
      include: {
        categories: { select: { name: true, slug: true }, orderBy: { order: 'asc' } },
        author: { select: { nickname: true } },
      },
      orderBy: { installCount: 'desc' },
      take: 3,
    })

    return NextResponse.json(related)
  } catch (error) {
    console.error('获取相关 skill 失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
