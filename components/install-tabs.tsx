'use client'

import { useState } from 'react'
import { Copy, Check, Terminal, FileText, Download } from 'lucide-react'

interface InstallTabsProps {
  skillId: string
  slug?: string
  content: string | null
  fileUrl?: string | null
}

type Tab = 'command' | 'copy' | 'download'

export function InstallTabs({ skillId, slug, content, fileUrl }: InstallTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('command')
  const [copied, setCopied] = useState(false)

  const slugOrId = slug ?? skillId
  const command = `/install-skill hrskillshub/${slugOrId}`

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleDownload() {
    await fetch(`/api/skills/${skillId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installType: 'DOWNLOAD_FILE' }),
    })
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  const tabs = [
    { id: 'command' as Tab, label: 'Claude Code', icon: Terminal },
    { id: 'copy' as Tab, label: '复制内容', icon: FileText },
    { id: 'download' as Tab, label: '下载文件', icon: Download },
  ]

  return (
    <div className="border border-border">
      {/* Tab 头 */}
      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-r border-border last:border-r-0 transition-colors ${
              activeTab === id
                ? 'bg-foreground text-background'
                : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="p-4 bg-card">
        {activeTab === 'command' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              在 Claude Code 中执行以下命令安装此 Skill：
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-[var(--hero-bg)] px-4 py-3 border border-border overflow-x-auto">
                {command}
              </code>
              <button
                onClick={() => handleCopy(command)}
                className="flex items-center gap-1.5 px-3 py-3 border border-border text-sm hover:border-brand hover:text-brand transition-colors whitespace-nowrap"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? '已复制 ✓' : '复制'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'copy' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">直接复制 Skill 原始内容：</p>
            {content ? (
              <div className="flex items-start gap-2">
                <pre className="flex-1 text-xs font-mono bg-[var(--hero-bg)] px-4 py-3 border border-border overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {content.slice(0, 500)}{content.length > 500 ? '…' : ''}
                </pre>
                <button
                  onClick={() => handleCopy(content)}
                  className="flex items-center gap-1.5 px-3 py-3 border border-border text-sm hover:border-brand hover:text-brand transition-colors whitespace-nowrap"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copied ? '已复制 ✓' : '复制全部'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无可复制的文本内容</p>
            )}
          </div>
        )}

        {activeTab === 'download' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">下载 Skill 文件（.md 或 .zip）：</p>
            {fileUrl ? (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-medium hover:bg-brand transition-colors"
              >
                <Download size={14} />
                下载文件
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">此 Skill 暂无可下载文件</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
