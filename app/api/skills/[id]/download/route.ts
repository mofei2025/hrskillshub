import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const { installType } = await req.json()

  const validTypes = ['COPY_PROMPT', 'COPY_COMMAND', 'DOWNLOAD_FILE']
  const type = validTypes.includes(installType?.toUpperCase())
    ? installType.toUpperCase()
    : 'COPY_COMMAND'

  // 登录用户记录详细下载记录
  if (session?.user?.id) {
    await db.download.create({
      data: {
        skillId: params.id,
        userId: session.user.id,
        installType: type,
      },
    }).catch(() => {}) // 忽略重复等错误
  }

  // 所有用户（包括未登录）都计入安装次数
  await db.skill.update({
    where: { id: params.id },
    data: { installCount: { increment: 1 } },
  })

  return NextResponse.json({ success: true })
}
