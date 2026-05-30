import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 先验证 skill 存在且已发布
  const skill = await db.skill.findUnique({
    where: { id },
    select: { status: true },
  })

  if (!skill) return NextResponse.json({ error: '不存在' }, { status: 404 })
  if (skill.status !== 'PUBLISHED') return NextResponse.json({ error: '未发布' }, { status: 403 })

  const versions = await db.skillVersion.findMany({
    where: { skillId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(versions)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await params
    const skill = await db.skill.findUnique({ where: { id } })
    if (!skill) return NextResponse.json({ error: '不存在' }, { status: 404 })
    if (skill.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const { version, changelog } = await req.json()
    if (!version || !changelog) {
      return NextResponse.json({ error: '版本号和更新说明不能为空' }, { status: 400 })
    }

    const skillVersion = await db.skillVersion.create({
      data: { skillId: id, version, changelog },
    })

    return NextResponse.json(skillVersion, { status: 201 })
  } catch (error) {
    console.error('创建版本失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
