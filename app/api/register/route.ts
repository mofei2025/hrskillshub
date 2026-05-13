import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email, password, nickname } = await req.json()

  if (!email || !password || !nickname) {
    return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { email, password: hashedPassword, nickname },
    select: { id: true, email: true, nickname: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
