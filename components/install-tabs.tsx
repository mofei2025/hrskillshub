'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, FolderOpen } from 'lucide-react'

interface InstallTabsProps {
  skillId: string
  slug?: string
  fileUrl?: string | null
}

function deriveSkillName(fileUrl: string | null | undefined, skillId: string): string {
  if (!fileUrl) return skillId.slice(0, 12)
  try {
    const parts = new URL(fileUrl).pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] ?? skillId.slice(0, 12)
  } catch {
    return skillId.slice(0, 12)
  }
}

export function InstallTabs({ skillId, slug, fileUrl }: InstallTabsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const skillName = slug ?? deriveSkillName(fileUrl, skillId)
  const installPath = `~/.claude/skills/${skillName}/`

  const promptText = fileUrl
    ? `请将以下 HR Skill 安装到我的 AI 工具中：\n从 ${fileUrl} 下载所有文件，保存到 ${installPath} 目录（若目录不存在请先创建），安装完成后告诉我。`
    : ''

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)

    fetch(`/api/skills/${skillId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installType: 'COPY_COMMAND' }),
    }).catch(() => {})
  }

  const CopyBtn = ({ text, id, label = '复制' }: { text: string; id: string; label?: string }) => (
    <button
      onClick={() => copy(text, id)}
      className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-mono hover:border-brand hover:text-brand transition-colors whitespace-nowrap flex-shrink-0"
    >
      {copied === id
        ? <><Check size={12} className="text-green-500" />已复制</>
        : <><Copy size={12} />{label}</>
      }
    </button>
  )

  if (!fileUrl) {
    return (
      <div className="border border-border p-5 text-sm text-muted-foreground">
        此 Skill 暂未提供 GitHub 仓库链接，请联系作者获取安装文件。
      </div>
    )
  }

  return (
    <div className="border border-border divide-y divide-border">

      {/* ── 方法一：粘贴安装指令 ── */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-heading text-xs font-black uppercase tracking-tight">方法一</span>
          <span className="text-xs font-mono border border-brand text-brand px-2 py-0.5">推荐</span>
          <span className="text-xs text-muted-foreground">将安装指令粘贴到任意 AI 工具对话框</span>
        </div>
        <div className="flex items-start gap-2">
          <pre className="flex-1 text-xs font-mono bg-[var(--hero-bg)] border border-border px-4 py-3 whitespace-pre-wrap overflow-x-auto text-muted-foreground leading-relaxed">
            {promptText}
          </pre>
          <CopyBtn text={promptText} id="prompt" label="复制指令" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          AI 工具收到指令后会自动完成下载与安装，适用于 Claude Code、Codex 等支持文件操作的 AI 工具。
        </p>
      </div>

      {/* ── 方法二：手动安装 ── */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-heading text-xs font-black uppercase tracking-tight">方法二</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <FolderOpen size={11} />
            手动下载安装
          </span>
        </div>

        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="font-mono text-xs text-muted-foreground flex-shrink-0 w-4">1.</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1.5">创建 Skill 目录</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs bg-[var(--hero-bg)] border border-border px-3 py-2 overflow-x-auto">
                  mkdir -p {installPath}
                </code>
                <CopyBtn text={`mkdir -p ${installPath}`} id="mkdir" />
              </div>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="font-mono text-xs text-muted-foreground flex-shrink-0 w-4">2.</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1.5">从 GitHub 下载 Skill 文件到该目录</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono border border-border px-3 py-2 hover:border-brand hover:text-brand transition-colors"
              >
                <ExternalLink size={12} />
                在 GitHub 上查看 / 下载文件
              </a>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="font-mono text-xs text-muted-foreground flex-shrink-0 w-4">3.</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">重启 AI 工具或输入 <code className="font-mono bg-[var(--hero-bg)] px-1">/refresh</code> 加载新 Skill</p>
            </div>
          </li>
        </ol>

        {/* 安装路径参考 */}
        <div className="mt-4 border border-border bg-[var(--hero-bg)] px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">安装路径参考</p>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-20 flex-shrink-0">全局</span>
              <code className="text-foreground">~/.claude/skills/{skillName}/</code>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-20 flex-shrink-0">当前项目</span>
              <code className="text-foreground">.claude/skills/{skillName}/</code>
            </div>
          </div>
        </div>
      </div>

      {/* ── 方法三：GitHub ── */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading text-xs font-black uppercase tracking-tight">方法三</span>
            <span className="text-xs text-muted-foreground">查看完整源码与文档</span>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono border border-border px-3 py-1.5 hover:border-brand hover:text-brand transition-colors"
          >
            <ExternalLink size={12} />
            GitHub 仓库 →
          </a>
        </div>
      </div>
    </div>
  )
}
