'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const AI_OPTIONS = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'ChatGPT', value: 'chatgpt' },
  { label: 'Claude', value: 'claude' },
  { label: '通用（所有 AI）', value: 'all' },
]

interface Category {
  id: string
  name: string
}

interface SubmitTabsProps {
  categories: Category[]
}

// 基础表单字段（三种方式共用）
function BaseFields({
  form,
  onChange,
  categories,
}: {
  form: any
  onChange: (key: string, value: any) => void
  categories: Category[]
}) {
  return (
    <>
      <div>
        <Label>Skill 名称 *</Label>
        <Input
          value={form.title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="例如：JD 生成助手 - 招聘专员版"
          required
        />
      </div>

      <div>
        <Label>简介描述 *</Label>
        <Textarea
          value={form.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="用一两句话说明这个 Skill 能解决什么问题、适合谁使用"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>分类 *</Label>
          <Select value={form.categoryId} onValueChange={v => onChange('categoryId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>类型 *</Label>
          <Select value={form.type} onValueChange={v => onChange('type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROMPT">提示词</SelectItem>
              <SelectItem value="CLAUDE_SKILL">Claude Skill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>兼容 AI（可多选）</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {AI_OPTIONS.map(ai => (
            <label key={ai.value} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.compatibleAi.includes(ai.value)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...form.compatibleAi, ai.value]
                    : form.compatibleAi.filter((v: string) => v !== ai.value)
                  onChange('compatibleAi', next)
                }}
              />
              <span className="text-sm">{ai.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )
}

export function SubmitTabs({ categories }: SubmitTabsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const defaultForm = {
    title: '',
    description: '',
    categoryId: '',
    type: '',
    compatibleAi: [] as string[],
    content: '',
    fileUrl: '',
    version: '1.0.0',
    changelog: '',
  }

  const [form, setForm] = useState(defaultForm)

  function updateForm(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.skill?.status === 'PUBLISHED') {
          router.push(`/skills/${data.skill.id}`)
        } else {
          setMessage('提交成功！我们会在审核通过后发布，请耐心等待。')
          setForm(defaultForm)
        }
      } else {
        setMessage(data.error ?? '提交失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(file: File) {
    setLoading(true)
    setMessage('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url, error } = await res.json()
      if (error) { setMessage(error); return }
      updateForm('fileUrl', url)
      setMessage('文件上传成功！')
    } catch {
      setMessage('上传失败，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="form">
        <TabsList className="mb-6">
          <TabsTrigger value="form">📝 填写表单</TabsTrigger>
          <TabsTrigger value="editor">✏️ 在线编辑</TabsTrigger>
          <TabsTrigger value="upload">📦 上传文件</TabsTrigger>
        </TabsList>

        {/* 方式一：表单 */}
        <TabsContent value="form" className="space-y-4">
          <BaseFields form={form} onChange={updateForm} categories={categories} />
          <div>
            <Label>提示词内容 *</Label>
            <Textarea
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
              placeholder="粘贴你的完整提示词内容..."
              className="min-h-[200px] font-mono"
              required
            />
          </div>
        </TabsContent>

        {/* 方式二：在线 Markdown 编辑器 */}
        <TabsContent value="editor" className="space-y-4">
          <BaseFields form={form} onChange={updateForm} categories={categories} />
          <div>
            <Label>Markdown 内容</Label>
            <p className="text-xs text-gray-400 mb-1">支持 Markdown 格式，可以加标题、代码块等</p>
            <Textarea
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
              placeholder="# Skill 名称&#10;&#10;## 使用方法&#10;&#10;## 提示词内容"
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </TabsContent>

        {/* 方式三：上传 ZIP */}
        <TabsContent value="upload" className="space-y-4">
          <BaseFields form={form} onChange={updateForm} categories={categories} />
          <div>
            <Label>上传文件（.zip 或 .md，最大 10MB）</Label>
            <input
              type="file"
              accept=".zip,.md"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {form.fileUrl && (
              <p className="text-xs text-green-600 mt-1">✓ 文件已上传</p>
            )}
          </div>
          <div>
            <Label>使用说明（描述如何触发和使用这个 Skill）</Label>
            <Textarea
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
              placeholder="说明触发词是什么、需要输入哪些参数、会输出什么..."
              className="min-h-[120px]"
            />
          </div>
        </TabsContent>
      </Tabs>

      {message && (
        <p className={`mt-4 text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* 版本信息 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <Label>版本号</Label>
          <Input
            value={form.version}
            onChange={e => updateForm('version', e.target.value)}
            placeholder="例如：1.0.0"
          />
        </div>
        <div>
          <Label>更新说明</Label>
          <Input
            value={form.changelog}
            onChange={e => updateForm('changelog', e.target.value)}
            placeholder="简述本版本的改动"
          />
        </div>
      </div>

      <Button type="submit" className="mt-6 w-full" disabled={loading}>
        {loading ? '提交中...' : '提交 Skill'}
      </Button>
    </form>
  )
}
