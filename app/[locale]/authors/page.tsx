import Link from 'next/link'
import { db } from '@/lib/db'
import { Download, BookOpen, Users } from 'lucide-react'

export default async function AuthorsPage() {
  const authors = await db.user.findMany({
    where: {
      skills: { some: { status: 'PUBLISHED' } },
    },
    select: {
      id: true,
      nickname: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      _count: {
        select: {
          skills: { where: { status: 'PUBLISHED' } },
          followedBy: true,
        },
      },
      skills: {
        where: { status: 'PUBLISHED' },
        select: { installCount: true },
      },
    },
    orderBy: {
      skills: { _count: 'desc' },
    },
  })

  const authorsWithStats = authors.map((author, idx) => ({
    ...author,
    totalInstalls: author.skills.reduce((sum, s) => sum + s.installCount, 0),
    rank: idx + 1,
  }))

  const slug = (author: typeof authors[0]) => author.nickname ?? author.id
  const displayName = (author: typeof authors[0]) =>
    author.nickname ?? author.name ?? author.email

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 标题 */}
      <section
        className="border border-border p-8 mb-8 bg-[var(--hero-bg)]"
        style={{
          backgroundImage: `
            linear-gradient(var(--card-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--card-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand border border-brand px-3 py-1 inline-block mb-4">
          Authors
        </span>
        <h1 className="font-heading text-3xl font-black tracking-tight mb-2">
          作者排行榜
        </h1>
        <p className="text-muted-foreground text-sm">
          按发布 Skills 数量排名 · 共 {authors.length} 位贡献者
        </p>
      </section>

      {/* 前 3 名高亮 */}
      {authorsWithStats.length >= 3 && (
        <div className="grid grid-cols-3 gap-px bg-border border border-border mb-8">
          {authorsWithStats.slice(0, 3).map((author) => (
            <Link
              key={author.id}
              href={`/authors/${slug(author)}`}
              className="bg-card p-6 text-center hover:bg-[var(--hero-bg)] transition-colors group"
            >
              <div className="text-2xl font-heading font-black text-brand mb-3">
                #{author.rank}
              </div>
              <div className="w-14 h-14 mx-auto bg-foreground text-background flex items-center justify-center text-xl font-heading font-black border border-border mb-3">
                {displayName(author).charAt(0).toUpperCase()}
              </div>
              <div className="font-heading font-black text-sm truncate group-hover:text-brand transition-colors">
                {displayName(author)}
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-3">
                <span className="flex items-center gap-1">
                  <BookOpen size={10} />
                  {author._count.skills}
                </span>
                <span className="flex items-center gap-1">
                  <Download size={10} />
                  {author.totalInstalls >= 1000
                    ? `${(author.totalInstalls / 1000).toFixed(1)}k`
                    : author.totalInstalls}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 完整排行榜 */}
      <div className="border border-border divide-y divide-border">
        {/* 表头 */}
        <div className="grid grid-cols-12 bg-[var(--hero-bg)] px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span className="col-span-1">#</span>
          <span className="col-span-5">作者</span>
          <span className="col-span-2 text-center">Skills</span>
          <span className="col-span-2 text-center">安装</span>
          <span className="col-span-2 text-center">粉丝</span>
        </div>

        {authorsWithStats.map((author) => (
          <div key={author.id} className="grid grid-cols-12 items-center px-4 py-4 hover:bg-[var(--hero-bg)] transition-colors">
            {/* 排名 */}
            <div className="col-span-1">
              <span className={`font-heading font-black text-sm ${author.rank <= 3 ? 'text-brand' : 'text-muted-foreground'}`}>
                {author.rank}
              </span>
            </div>

            {/* 作者名 — 可点击 */}
            <div className="col-span-5 flex items-center gap-3">
              <Link href={`/authors/${slug(author)}`} className="flex items-center gap-3 group min-w-0">
                <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center text-sm font-heading font-black border border-border flex-shrink-0">
                  {displayName(author).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate group-hover:text-brand transition-colors">
                    {displayName(author)}
                  </div>
                  {author.bio && (
                    <div className="text-xs text-muted-foreground truncate">{author.bio}</div>
                  )}
                </div>
              </Link>
            </div>

            {/* Skills 数 — 可点击，跳转到作者页 Skills 区 */}
            <div className="col-span-2 text-center">
              <Link
                href={`/authors/${slug(author)}#skills`}
                className="font-heading font-black text-sm hover:text-brand transition-colors"
              >
                {author._count.skills}
              </Link>
            </div>

            {/* 安装量 */}
            <div className="col-span-2 text-center">
              <span className="text-sm text-muted-foreground">
                {author.totalInstalls >= 1000
                  ? `${(author.totalInstalls / 1000).toFixed(1)}k`
                  : author.totalInstalls}
              </span>
            </div>

            {/* 粉丝数 — 可点击 */}
            <div className="col-span-2 text-center">
              <Link
                href={`/authors/${slug(author)}`}
                className="text-sm text-muted-foreground hover:text-brand transition-colors flex items-center justify-center gap-1"
              >
                <Users size={12} />
                {author._count.followedBy}
              </Link>
            </div>
          </div>
        ))}

        {authorsWithStats.length === 0 && (
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
            暂无贡献者
          </div>
        )}
      </div>
    </div>
  )
}
