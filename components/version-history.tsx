import { db } from '@/lib/db'
import { Tag } from 'lucide-react'

interface VersionHistoryProps {
  skillId: string
}

export async function VersionHistory({ skillId }: VersionHistoryProps) {
  const versions = await db.skillVersion.findMany({
    where: { skillId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  if (versions.length === 0) return null

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <Tag size={14} />
          版本历史
        </h3>
      </div>
      <div className="divide-y divide-border">
        {versions.map((v) => (
          <div key={v.id} className="px-4 py-3 flex items-start gap-4">
            <span className="font-mono text-xs bg-[var(--hero-bg)] border border-border px-2 py-0.5 whitespace-nowrap mt-0.5">
              {v.version}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{v.changelog}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(v.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
