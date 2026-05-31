import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { SecurityGrade } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { grade, score, notes, reason } = body

    const validGrades: SecurityGrade[] = ['S', 'A', 'B', 'C', 'D', 'PENDING']
    if (!validGrades.includes(grade)) {
      return NextResponse.json({ error: '无效的评级值' }, { status: 400 })
    }

    const updated = await db.skill.update({
      where: { id },
      data: {
        securityGrade: grade as SecurityGrade,
        securityScore: typeof score === 'number' ? score : null,
        securityNotes: notes ?? null,
        securityOverriddenBy: session.user.id,
      },
    })

    revalidatePath('/skills')
    revalidatePath(`/skills/${id}`)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('安全评级 API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
