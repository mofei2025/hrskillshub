'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function PageTracker() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    // 跳过管理后台页面
    if (pathname.includes('/admin')) return
    // 避免重复上报同一路径
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    const referrer = prevPath.current === null ? document.referrer : ''

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer }),
    }).catch(() => {})
  }, [pathname])

  return null
}
