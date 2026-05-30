import { SecurityGrade } from '@prisma/client'

interface GradeBadgeProps {
  grade: SecurityGrade
  size?: 'sm' | 'md'
}

const gradeConfig = {
  A: { label: '✓ Grade A', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' },
  B: { label: 'Grade B', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700' },
  C: { label: 'Grade C', className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700' },
  PENDING: { label: '待评级', className: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600' },
}

export function GradeBadge({ grade, size = 'sm' }: GradeBadgeProps) {
  const config = gradeConfig[grade]
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span
      className={`inline-block border font-mono font-medium ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  )
}
