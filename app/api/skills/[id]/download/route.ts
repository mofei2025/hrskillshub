import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { installType } = await req.json()

  await db.download.create({
    data: {
      skillId: params.id,
      userId: session.user.id,
      installType: installType.toUpperCase(),
    },
  })

  await db.skill.update({
    where: { id: params.id },
    data: {
      downloadCount: { increment: 1 },
      installCount: { increment: 1 },
    },
  })

  return NextResponse.json({ success: true })
}
