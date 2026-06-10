'use client'

import { useEffect, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// 生成简单的随机 ID
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// 获取或创建 sessionId（Tab 内持久，关闭 Tab 后重置）
function getSessionId() {
  if (typeof sessionStorage === 'undefined') return null
  let id = sessionStorage.getItem('_sid')
  if (!id) {
    id = generateId()
    sessionStorage.setItem('_sid', id)
  }
  return id
}

function TrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const stateRef = useRef<{
    prevPath: string | null
    prevViewId: string | null
    enteredAt: number
    prevSearchQ: string | null
  }>({
    prevPath: null,
    prevViewId: null,
    enteredAt: Date.now(),
    prevSearchQ: null,
  })

  // 路由变化时上报页面访问
  useEffect(() => {
    if (pathname.includes('/admin')) return

    const state = stateRef.current
    const now = Date.now()
    const prevDuration = state.prevPath !== null ? (now - state.enteredAt) / 1000 : 0
    const sessionId = getSessionId()

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: state.prevPath === null ? document.referrer : state.prevPath,
        sessionId,
        prevViewId: state.prevViewId,
        prevDuration: prevDuration > 0 ? prevDuration : undefined,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.viewId) stateRef.current.prevViewId = data.viewId
      })
      .catch(() => {})

    stateRef.current.prevPath = pathname
    stateRef.current.enteredAt = now
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // 搜索词追踪
  useEffect(() => {
    if (!pathname.includes('/skills')) return
    const q = searchParams.get('q')
    if (!q || q === stateRef.current.prevSearchQ) return
    stateRef.current.prevSearchQ = q

    fetch('/api/track/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, sessionId: getSessionId() }),
    }).catch(() => {})
  }, [pathname, searchParams])

  return null
}

export function PageTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  )
}
