# 部署说明

## 1. 服务器准备

在阿里云 ECS / 腾讯云 CVM 上安装 Docker 和 Docker Compose：

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## 2. 上传代码

```bash
git clone <你的代码仓库地址>
cd hrskillshub
```

## 3. 配置环境变量

复制 `.env.example` 并填入生产环境的值：

```bash
cp .env.example .env.prod
```

编辑 `.env.prod`，填入以下内容：

```
DB_PASSWORD=你的数据库密码（自行设置一个强密码）
AUTH_SECRET=你的 NextAuth 密钥（运行 openssl rand -base64 32 生成）
NEXTAUTH_URL=https://你的域名
NEXT_PUBLIC_SITE_URL=https://你的域名
OSS_REGION=oss-cn-hangzhou（根据你的 OSS 地域填写）
OSS_ACCESS_KEY_ID=你的阿里云 AccessKey ID
OSS_ACCESS_KEY_SECRET=你的阿里云 AccessKey Secret
OSS_BUCKET=你的 OSS Bucket 名称
```

## 4. 启动服务

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 5. 初始化数据库

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

## 6. 更新部署

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## 7. 查看日志

```bash
docker compose -f docker-compose.prod.yml logs -f app
```
