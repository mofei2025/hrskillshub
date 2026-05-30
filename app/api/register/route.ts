import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册，请直接登录' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname: nickname?.trim() || null,
        name: nickname?.trim() || null,
      },
      select: { id: true, email: true, nickname: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}
