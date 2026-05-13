import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { name, slug } = await req.json()

  if (!name || !slug) {
    return NextResponse.json({ error: '名称和 slug 不能为空' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'slug 只允许小写字母、数字和连字符（-）' },
      { status: 400 }
    )
  }

  try {
    const category = await db.category.create({ data: { name, slug } })
    return NextResponse.json({ category }, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: '分类名称或 slug 已存在' }, { status: 409 })
    }
    throw e
  }
}
