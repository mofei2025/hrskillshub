import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'as-needed',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
