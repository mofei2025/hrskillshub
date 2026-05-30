import { redirect } from 'next/navigation'

// 重定向到 i18n 版本
export default function ProfileRedirect() {
  redirect('/zh/profile')
}
