import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma, SecurityGrade, SkillType } from '@prisma/client'

// GET /api/skills - 获取 Skill 列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const ai = searchParams.get('ai')
  const sort = searchParams.get('sort') ?? 'newest'
  const q = searchParams.get('q')
  const grade = searchParams.get('grade')

  // 分页参数（默认第1页，每页50条，最大100条）
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const skip = (page - 1) * limit

  const where: Prisma.SkillWhereInput = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }
  if (ai) where.compatibleAi = { has: ai }

  // grade 枚举白名单校验
  const VALID_GRADES: SecurityGrade[] = ['A', 'B', 'C', 'PENDING']
  if (grade && grade !== 'ALL' && VALID_GRADES.includes(grade as SecurityGrade)) {
    where.securityGrade = grade as SecurityGrade
  }

  // type 枚举白名单校验
  const VALID_TYPES: SkillType[] = ['PROMPT', 'CLAUDE_SKILL']
  if (type && VALID_TYPES.includes(type.toUpperCase() as SkillType)) {
    where.type = type.toUpperCase() as SkillType
  }

  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ]

  const orderBy: Prisma.SkillOrderByWithRelationInput =
    sort === 'downloads' ? { downloadCount: 'desc' }
    : sort === 'favorites' ? { favoriteCount: 'desc' }
    : { publishedAt: 'desc' }

  const skills = await db.skill.findMany({
    where,
    orderBy,
    take: limit,
    skip,
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
  const { title, description, content, type, compatibleAi, categoryId, fileUrl, version, changelog } = body

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
      version: version ?? '1.0.0',
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })

  return NextResponse.json({ skill, status }, { status: 201 })
}
