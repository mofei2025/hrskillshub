import { SecurityGrade } from '@prisma/client'
import { Shield, CheckCircle, AlertTriangle, XCircle, Star } from 'lucide-react'

interface SecurityNote {
  category: string
  severity: 'low' | 'medium' | 'high'
  description: string
  passed: boolean
}

interface SecurityPanelProps {
  grade: SecurityGrade
  score: number | null
  notes: unknown
}

const threatCategories = [
  '提示词注入',
  '凭据盗取',
  '数据外泄',
  '代码执行',
  'Unicode 隐藏指令',
  '混淆/编码',
  '权限提升',
  '供应链攻击',
  '语义操纵',
  '行为控制',
]

const gradeDisplay = {
  S: { label: 'S 级', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: Star },
  A: { label: 'A 级', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  B: { label: 'B 级', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Shield },
  C: { label: 'C 级', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: AlertTriangle },
  D: { label: 'D 级', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  PENDING: { label: '待评级', color: 'text-muted-foreground', bg: 'bg-[var(--hero-bg)]', icon: Shield },
}

function isSecurityNote(item: unknown): item is SecurityNote {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return typeof obj.category === 'string' || typeof obj.description === 'string'
}

export function SecurityPanel({ grade, score, notes }: SecurityPanelProps) {
  const display = gradeDisplay[grade] ?? gradeDisplay.PENDING
  const Icon = display.icon
  const securityNotes = Array.isArray(notes) ? notes.filter(isSecurityNote) : []

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-[var(--hero-bg)]">
        <h3 className="font-heading text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <Shield size={14} />
          安全评级
        </h3>
      </div>

      <div className={`p-4 ${display.bg}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon size={24} className={display.color} />
          <div>
            <div className={`font-heading text-xl font-black ${display.color}`}>
              {display.label}
            </div>
            {score !== null && (
              <div className="text-xs text-muted-foreground">
                安全分数：{score}/100
              </div>
            )}
          </div>
        </div>

        {grade === 'PENDING' && (
          <p className="text-xs text-muted-foreground">扫描进行中或尚未触发</p>
        )}
      </div>

      {securityNotes.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          {securityNotes.slice(0, 5).map((note, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-2 text-xs">
              {note.passed ? (
                <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-muted-foreground">{note.category || note.description}</span>
            </div>
          ))}
        </div>
      )}

      {securityNotes.length === 0 && grade !== 'PENDING' && (
        <div className="px-4 py-3 border-t border-border">
          <div className="space-y-1.5">
            {threatCategories.slice(0, 5).map((cat) => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <CheckCircle size={10} className="text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
