import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { SkillRowActions } from './skill-row-actions'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: '待审核', variant: 'outline' },
  PUBLISHED: { label: '已发布', variant: 'default' },
  REJECTED: { label: '已拒绝', variant: 'destructive' },
}

const TYPE_LABELS: Record<string, string> = {
  PROMPT: '提示词',
  CLAUDE_SKILL: 'Claude Skill',
}

async function getAllSkills(page: number) {
  const pageSize = 20
  const [skills, total] = await Promise.all([
    db.skill.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { nickname: true } },
        category: { select: { name: true } },
      },
    }),
    db.skill.count(),
  ])
  return { skills, total, pageSize }
}

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const { skills, total, pageSize } = await getAllSkills(page)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Skills 管理
        <span className="ml-2 text-sm font-normal text-gray-500">共 {total} 条</span>
      </h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">标题</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">分类</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">作者</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">提交时间</th>
              <th className="px-4 py-3 w-44"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {skills.map((skill) => {
              const statusCfg = STATUS_CONFIG[skill.status]
              return (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{skill.title}</td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[skill.type] ?? skill.type}</td>
                  <td className="px-4 py-3 text-gray-500">{skill.category.name}</td>
                  <td className="px-4 py-3 text-gray-500">{skill.author.nickname}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(skill.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <SkillRowActions skillId={skill.id} currentStatus={skill.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/skills?page=${page - 1}`} className="px-3 py-1 border rounded hover:bg-gray-50">上一页</a>
            )}
            {page < totalPages && (
              <a href={`/admin/skills?page=${page + 1}`} className="px-3 py-1 border rounded hover:bg-gray-50">下一页</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
