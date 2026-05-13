import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// Prisma 7 需要通过 Driver Adapter 连接数据库
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const categories = [
    { name: '招聘', slug: 'recruitment' },
    { name: '绩效管理', slug: 'performance' },
    { name: '薪酬福利', slug: 'compensation' },
    { name: '员工关系', slug: 'employee-relations' },
    { name: '培训发展', slug: 'training' },
    { name: '人力规划', slug: 'planning' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  const hashedPassword = await bcrypt.hash('admin123456', 12)
  await prisma.user.upsert({
    where: { email: 'admin@hrskillshub.com' },
    update: {},
    create: {
      email: 'admin@hrskillshub.com',
      password: hashedPassword,
      nickname: '管理员',
      role: 'ADMIN',
    },
  })

  console.log('种子数据初始化完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
