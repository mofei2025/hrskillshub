import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SecurityGrade } from '@prisma/client'

// GET /api/skills - 获取 Skill 列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const ai = searchParams.get('ai')
  const sort = searchParams.get('sort') ?? 'newest'
  const q = searchParams.get('q')
  const grade = searchParams.get('grade')

  const where: any = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }
  if (type) where.type = type.toUpperCase()
  if (ai) where.compatibleAi = { has: ai }
  if (grade && grade !== 'ALL') where.securityGrade = grade as SecurityGrade
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ]

  const orderBy: any =
    sort === 'downloads' ? { downloadCount: 'desc' }
    : sort === 'favorites' ? { favoriteCount: 'desc' }
    : { publishedAt: 'desc' }

  const skills = await db.skill.findMany({
    where,
    orderBy,
    include: {
      author: { select: { nickname: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  return NextResponse.json({ skills })
}

// POST /api/skills - 创建新 Skill
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, content, type, compatibleAi, categoryId, fileUrl } = body

  if (!title || !description || !type || !categoryId) {
    return NextResponse.json({ error: '请填写必填项' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  const status = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN'
    ? 'PUBLISHED'
    : 'PENDING'

  const skill = await db.skill.create({
    data: {
      title,
      description,
      content,
      fileUrl,
      type: type.toUpperCase(),
      compatibleAi: compatibleAi ?? [],
      categoryId,
      authorId: session.user.id,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })

  return NextResponse.json({ skill, status }, { status: 201 })
}
