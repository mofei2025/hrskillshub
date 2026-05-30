import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SubmitTabs } from '@/components/submit-tabs'

export default async function SubmitPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const categories = await db.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })

  return (
    <div className="min-h-screen">
      {/* 页头 — 与首页英雄区同风格 */}
      <section
        className="bg-[var(--hero-bg)] border-b border-border py-14 px-4"
        style={{
          backgroundImage: `
            linear-gradient(var(--card-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--card-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand border border-brand px-3 py-1">
              Contribute
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-black leading-tight tracking-tight mb-3">
            分享你的 <span className="text-brand">Skill</span>
          </h1>
          <p className="text-muted-foreground text-base">
            选择最适合你的方式上传。普通用户提交后需经过审核才会发布。
          </p>
        </div>
      </section>

      {/* 表单区 */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <SubmitTabs categories={categories} />
      </div>
    </div>
  )
}
