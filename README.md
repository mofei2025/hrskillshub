# HRSkillHub

> 专为 HR 从业者打造的 AI Skills 分享社区，精选经过安全审核的技能包。

HRSkillHub 是一个开源的 HR AI Skills 分享平台，HR 从业者可以在此发现、分享和使用各种 AI 技能包，涵盖人力资源六大模块，适配人力资源三支柱模型，同时包括办公通用等场景。

## 功能特性

- **Skills 浏览与搜索** — 按分类、安全等级、安装次数筛选
- **安全评级系统** — S / A / B / C / D 五级评级，保障质量
- **用户系统** — 注册登录、个人主页、关注作者
- **技能提交** — 任何人均可提交 Skill，经管理员审核后公开展示
- **管理后台** — 数据看板、Skills 审核、用户管理、分类管理
- **访客统计** — 集成 Umami，实时查看 PV/UV 等访问数据
- **暗色模式** — 支持亮色 / 暗色主题切换

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 数据库 | PostgreSQL + Prisma ORM |
| 认证 | NextAuth.js v5 |
| 样式 | Tailwind CSS |
| 部署 | 任意支持 Node.js 的服务器 |

## 本地运行

### 前置要求

- Node.js 18+
- PostgreSQL 数据库

### 步骤

**1. 克隆仓库**

```bash
git clone https://github.com/mofei2025/hrskillshub.git
cd hrskillshub
```

**2. 安装依赖**

```bash
npm install
```

**3. 配置环境变量**

复制示例文件并填入你自己的配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 数据库
DATABASE_URL="postgresql://用户名:密码@localhost:5432/hrskillshub"

# NextAuth（可用 openssl rand -base64 32 生成随机值）
AUTH_SECRET="你的随机密钥"
NEXTAUTH_URL="http://localhost:3000"

# 站点地址
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**4. 初始化数据库**

```bash
npx prisma migrate deploy
npx prisma generate
```

**5. 启动开发服务器**

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可看到效果。

**6. 创建管理员账号**

注册账号后，在数据库中将该用户的 `role` 字段改为 `ADMIN`：

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = '你的邮箱';
```

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | ✅ | NextAuth 加密密钥 |
| `NEXTAUTH_URL` | ✅ | 网站地址 |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 公开访问地址 |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth 登录（可选） |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth 登录（可选） |
| `UMAMI_API_KEY` | ❌ | Umami 访客统计（可选） |
| `UMAMI_WEBSITE_ID` | ❌ | Umami 网站 ID（可选） |

## 参与贡献

欢迎提交 Pull Request！流程如下：

1. Fork 本仓库
2. 创建你的分支：`git checkout -b feature/你的功能名`
3. 提交改动：`git commit -m 'feat: 添加某功能'`
4. 推送分支：`git push origin feature/你的功能名`
5. 在 GitHub 上发起 Pull Request

**提交前请确保：**
- 本地 `npm run build` 能成功构建
- 没有提交 `.env.local` 或任何包含密钥的文件

## License

MIT
