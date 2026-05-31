# 部署说明

本项目使用 **Node.js + PM2** 部署，不使用 Docker。

## 快速部署

```bash
# 1. 克隆代码
git clone https://github.com/mofei2025/hrskillshub.git
cd hrskillshub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入数据库连接、NextAuth 密钥等

# 4. 初始化数据库
DATABASE_URL="你的连接串" npx prisma migrate deploy
npx prisma generate

# 5. 构建并启动
npm run build
pm2 start npm --name hrskillshub -- start
```

## 环境变量

详见 `.env.example`，核心变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | ✅ | NextAuth 加密密钥（`openssl rand -base64 32`） |
| `NEXTAUTH_URL` | ✅ | 网站完整地址 |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 公开访问地址 |
| `UMAMI_API_KEY` | ❌ | Umami 访客统计 API Key（管理后台需要） |
| `UMAMI_WEBSITE_ID` | ❌ | Umami 网站 ID |

## 更新部署

```bash
git pull
npm install
npm run build
pm2 restart hrskillshub
```

## 注意事项

- 如服务器使用 nvm，需先 `source /www/server/nvm/nvm.sh && nvm use 20`
- `prisma migrate deploy` 必须显式传 `DATABASE_URL`，不会自动读取 `.env.local`
- 创建管理员：`UPDATE "User" SET role = 'ADMIN' WHERE email = '你的邮箱';`
