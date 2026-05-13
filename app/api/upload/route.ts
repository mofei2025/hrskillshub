import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToOSS } from '@/lib/oss'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: '请选择文件' }, { status: 400 })
  }

  if (!file.name.endsWith('.zip') && !file.name.endsWith('.md')) {
    return NextResponse.json({ error: '仅支持 .zip 或 .md 文件' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToOSS(buffer, file.name)
    return NextResponse.json({ url })
  } catch (_e) {
    return NextResponse.json({ error: '文件上传失败，请稍后重试' }, { status: 500 })
  }
}
