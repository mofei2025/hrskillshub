import type { Metadata } from 'next'
import { Archivo_Black, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/session-provider'
import { ThemeProvider } from 'next-themes'
import { PageTracker } from '@/components/page-tracker'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'HRSkiilHub - HR 行业 AI Skills 分享平台',
  description: '专为 HR 从业者打造的 AI Skills 分享社区，精选经过安全审核的技能包',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Nav />
            <main>{children}</main>
            <Toaster />
            <PageTracker />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
