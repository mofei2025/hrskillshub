'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      退出
    </button>
  )
}
