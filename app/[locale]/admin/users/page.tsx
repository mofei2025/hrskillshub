import { db } from '@/lib/db'
import { UserRoleSelect } from './user-role-select'

async function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      createdAt: true,
      _count: { select: { skills: true } },
    },
  })
}

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        用户管理
        <span className="ml-2 text-sm font-normal text-gray-500">共 {users.length} 位</span>
      </h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">昵称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">邮箱</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">上传数</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">注册时间</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">角色</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.nickname}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-gray-500 text-center">{user._count.skills}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <UserRoleSelect userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
