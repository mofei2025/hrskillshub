import { NextRequest, NextResponse } from 'next/server'
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

  const { role } = await req.json()
  const validRoles = ['USER', 'CONTRIBUTOR', 'ADMIN']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: '无效的角色值' }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: { role },
    select: { id: true, email: true, nickname: true, role: true },
  })

  return NextResponse.json({ user })
}
