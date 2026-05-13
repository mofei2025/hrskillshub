'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Terminal, Download } from 'lucide-react'

interface InstallGuideProps {
  skillId: string
  skillTitle: string
  content: string | null
  fileUrl: string | null
  type: string
}

export function InstallGuide({ skillId, skillTitle, content, fileUrl, type }: InstallGuideProps) {
  const { data: session } = useSession()
  const [copied, setCopied] = useState<string | null>(null)

  async function recordDownload(installType: string) {
    await fetch(`/api/skills/${skillId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installType: installType.toUpperCase() }),
    })
  }

  async function handleCopy(text: string, key: string, installType: string) {
    await navigator.clipboard.writeText(text)
    await recordDownload(installType)
    setCopied(key)
    setTimeout(() => setCopied(null), 3000)
  }

  function LoginPrompt() {
    return (
      <a href="/login" className="text-blue-600 text-sm hover:underline">
        登录后使用
      </a>
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const installCommand = `curl -fsSL ${siteUrl}/api/skills/${skillId}/install | bash`

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">如何使用</h2>

      {/* 第一级：复制提示词 */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-green-100 text-green-700 border-green-200">简单</Badge>
          <span className="font-medium">① 直接复制提示词</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          适合所有人，粘贴到 DeepSeek、ChatGPT、Claude 等任意 AI 对话框即可使用
        </p>
        {content ? (
          <div className="bg-gray-50 rounded p-3 text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto mb-2">
            {content.slice(0, 200)}{content.length > 200 ? '...' : ''}
          </div>
        ) : null}
        {session ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => content && handleCopy(content, 'prompt', 'copy_prompt')}
            disabled={!content}
            className="gap-2"
          >
            {copied === 'prompt' ? <><Check className="h-4 w-4" />已复制</> : <><Copy className="h-4 w-4" />复制提示词</>}
          </Button>
        ) : <LoginPrompt />}
      </div>

      {/* 第二级：Claude Code 安装命令（仅 claude_skill 类型显示） */}
      {type === 'CLAUDE_SKILL' && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">中级</Badge>
            <span className="font-medium">② Claude Code 一键安装</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            适合已安装 Claude Code 的用户。复制命令后，打开电脑的终端（Mac：按 Command+空格 搜索「终端」）粘贴执行。
          </p>
          <div className="bg-gray-900 text-green-400 rounded p-3 text-sm font-mono mb-2 flex items-center justify-between">
            <span>{installCommand}</span>
          </div>
          {session ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(installCommand, 'command', 'copy_command')}
              className="gap-2"
            >
              {copied === 'command' ? <><Check className="h-4 w-4" />已复制</> : <><Terminal className="h-4 w-4" />复制安装命令</>}
            </Button>
          ) : <LoginPrompt />}
        </div>
      )}

      {/* 第三级：手动下载 */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">进阶</Badge>
          <span className="font-medium">{type === 'CLAUDE_SKILL' ? '③' : '②'} 手动下载安装</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          适合想完全掌控文件位置的用户。下载后按照说明放到指定目录。
        </p>
        {session ? (
          fileUrl ? (
            <a href={fileUrl} onClick={() => recordDownload('download_file')}>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />下载文件
              </Button>
            </a>
          ) : content ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([content], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${skillTitle}.md`
                a.click()
                recordDownload('download_file')
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />下载文件
            </Button>
          ) : (
            <p className="text-sm text-gray-400">暂无可下载文件</p>
          )
        ) : <LoginPrompt />}
      </div>
    </div>
  )
}
