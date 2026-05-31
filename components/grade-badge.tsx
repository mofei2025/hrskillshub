import { SecurityGrade } from '@prisma/client'

interface GradeBadgeProps {
  grade: SecurityGrade
  size?: 'sm' | 'md'
}

const gradeConfig = {
  S: { label: '★ S 级', className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700' },
  A: { label: '◆ A 级', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' },
  B: { label: '● B 级', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' },
  C: { label: '▲ C 级', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700' },
  D: { label: '▼ D 级', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' },
  PENDING: { label: '○ 待评级', className: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600' },
}

export function GradeBadge({ grade, size = 'sm' }: GradeBadgeProps) {
  const config = gradeConfig[grade] ?? gradeConfig.PENDING
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span
      className={`inline-block border font-mono font-medium ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  )
}
