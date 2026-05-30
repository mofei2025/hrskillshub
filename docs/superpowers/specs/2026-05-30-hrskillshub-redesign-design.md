# HRSkillsHub 全面升级设计文档

**日期**：2026-05-30
**参考**：skillstore.io、skillsdirectory.com、agentskills.me
**实施策略**：核心路径优先（方案 3）

---

## 1. 目标概述

对 HRSkillsHub 进行全面视觉重设计与功能扩展，参考 skillstore.io 等 AI Skills 市场平台的 UI 交互与功能模块，打造面向 HR 从业者的专业 AI Skills 分享平台。

---

## 2. 设计系统

### 2.1 视觉风格

**Swiss Modern（包豪斯网格风）**

- 字体：`Archivo Black`（标题、Logo、强调）+ `Space Grotesk`（正文、UI）+ `JetBrains Mono`（代码、版本号）
- 主色：纯黑 `#000000` / 纯白 `#ffffff`
- 唯一品牌强调色：红色 `#ff3300`（两种模式完全一致）
- 品牌识别：顶部 `3px solid #ff3300` 红线贯穿所有页面
- 布局：网格系统，直角无圆角，极细分隔线

### 2.2 明暗模式

通过 `<html data-theme="dark">` 切换，CSS 变量统一管理，自动跟随系统偏好（`prefers-color-scheme`），手动设置存入 `localStorage`。

**白天模式（Light）**

| 元素 | 值 |
|------|----|
| 英雄区背景 | `#f5f5f5` + 灰色网格底纹 |
| 导航背景 | `#ffffff` |
| 卡片背景 | `#ffffff` |
| 卡片分隔 | `#e8e8e8` |
| 主文字 | `#000000` |
| 次文字 | `#555555` |
| 搜索框 | 白底 + `2px solid #000` |
| 分类激活 | `#ff3300` 红底白字（**不用黑色**） |

**夜间模式（Dark）**

| 元素 | 值 |
|------|----|
| 页面背景 | `#0d0d0d` |
| 导航/英雄 | `#0a0a0a` |
| 卡片背景 | `#111111` |
| 卡片分隔 | `#1e1e1e` |
| 主文字 | `#f0f0f0` |
| 次文字 | `#555555` |
| 搜索框 | `#111` + `1px solid #2a2a2a` |
| 分类激活 | `#ff3300` 红底白字 |

---

## 3. 功能模块

### 3.1 现有功能（保留升级）

- Skills 列表 + 多维筛选（分类、类型、兼容 AI、关键词、排序）
- Skill 详情页 + 安装指南
- 评分评论系统
- 收藏 / 下载 / 安装统计
- 提交 & 审核流程
- 管理后台（用户、分类、Skills 管理）

### 3.2 新增功能模块

#### A. 作者主页（`/authors/:username`）

- 作者头像、昵称、简介、加入时间
- 关注按钮（需登录）
- 统计：发布 Skills 数、总安装量、平均评分、关注者数
- 发布的 Skills 列表（2列网格，含版本号和 Grade 徽章）
- 近期活动时间线（发布、审核通过、更新）
- 右侧栏：贡献分布进度条、成就徽章、擅长领域标签

#### B. 一键安装命令（突出展示）

详情页安装区域三个 Tab：

1. **Claude Code**：显示 `/install-skill hrskillshub/<slug>` 命令，一键复制
2. **复制内容**：直接复制 Skill 原始文本
3. **下载文件**：下载 `.md` 或 `.zip` 文件

复制按钮 hover 变红（`#ff3300`），复制成功显示"已复制 ✓"反馈。

#### C. 版本历史

- Skill 详情页展示版本列表（版本号 + 更新描述 + 日期）
- 数据库新增 `SkillVersion` 表
- 提交时可填写更新说明
- 最新版本在详情页顶部以 `v{major}.{minor}.{patch}` 格式显示

#### D. 相关推荐

- 详情页右侧栏展示 3 个相关 Skills
- 推荐逻辑：相同分类 → 按安装数排序 → 排除当前 Skill
- 展示：标题 + 安装数 + Grade 徽章

#### E. 中/英双语（i18n）

- 右上角 `中 / EN` 切换按钮
- 使用 `next-intl` 实现路由级国际化（`/zh` 和 `/en` 前缀）
- 翻译文件：`messages/zh.json` + `messages/en.json`
- UI 文本、导航、按钮、提示信息全部支持双语
- Skill 内容本身不翻译（用户原始内容保留）

#### F. 安全评级系统（Grade A/B/C）

参考 skillsdirectory.com 的方式，集成开源工具 **Cisco AI Defense skill-scanner**（Apache 许可证，`github.com/cisco-ai-defense/skill-scanner`）实现自动扫描，管理员可手动覆盖评级。

**评级标准（基于 100 分起扣，参考业界共识）**：

| 等级 | 分数区间 | 描述 | 展示 |
|------|----------|------|------|
| Grade A | 90–100 | 无安全风险，推荐使用 | 绿色 `✓ Grade A` 徽章 |
| Grade B | 70–89 | 存在低风险项（如外部链接） | 黄色 `Grade B` 徽章 |
| Grade C | < 70 | 存在中/高风险项，谨慎使用 | 橙色 `Grade C` 徽章 |
| 待审核 | — | 扫描进行中或尚未触发 | 灰色 `待评级` 徽章 |

低置信度发现扣分减半（与 skillsdirectory.com 逻辑一致）。

**10 个威胁类别（skill-scanner 覆盖范围）**：

1. 提示词注入（Prompt Injection）
2. 凭据盗取（Credential Theft）
3. 数据外泄（Data Exfiltration）
4. 代码执行（Code Execution）
5. Unicode 隐藏指令（Hidden Unicode Instructions）
6. 混淆/编码（Obfuscation：base64、同形字）
7. 权限提升（Privilege Escalation）
8. 供应链攻击（Supply Chain Risk）
9. 语义操纵（Semantic Manipulation）
10. 行为控制（Behavioral Control）

**扫描流程**：

```
用户提交 Skill（内容写入数据库，状态 PENDING）
    ↓
后端触发异步任务（队列/后台 job）
    ↓
调用 skill-scanner CLI（子进程执行，超时 30s）
    ↓
解析 JSON 结果 → 计算分数 → 写入 securityGrade + securityNotes
    ↓
管理员审核时可查看扫描详情，可手动覆盖评级（记录覆盖原因）
    ↓
前端展示 Grade 徽章 + 各类别扫描条目（通过 ✓ / 警告 ⚠）
```

**实现方式**：

- 安装：`npm install -g @cisco-ai-defense/skill-scanner`（或作为项目依赖）
- 调用：`skill-scanner scan <skill-file-path> --output json`
- 后端用 Node.js `child_process.execFile` 异步调用，避免阻塞主线程
- 扫描结果为 JSON，解析后存入 `Skill.securityNotes`（包含每条发现的类别、严重度、描述）

**展示位置**：
- Skills 列表卡片：右上角小徽章
- Skill 详情页：顶部 badges 行 + 右侧栏安全详情面板
- 详情页安全面板：Grade 大字母 + 各类别扫描条目列表

**数据库**：`Skill` 表新增 `securityGrade`（枚举：A/B/C/PENDING）、`securityScore`（Int，0-100）、`securityNotes`（JSON，存储各类别扫描详情）、`securityOverriddenBy`（String，记录手动覆盖的管理员 ID）字段。

---

## 4. 页面结构

### 4.1 首页（搜索优先）

```
顶部红线（3px #ff3300）
导航栏：Logo | Skills · 作者 · 文档 | 中/EN · 🌙 · 提交
────────────────────────────────────────
英雄区（浅灰 #f5f5f5 / 暗色 #0a0a0a）
  标签：HR AI Skills Marketplace
  大标题：发现最好的 HR AI Skills（Archivo Black 52px）
  副标题：精选 200+ 个经过安全审核的提示词与技能包
  搜索框（黑色描边 + 红色搜索按钮）
  热门搜索标签（面试话术 / OKR 助手 / 绩效评估…）
  统计行：200+ Skills · 48k 次安装 · 1.2k 贡献者 · 98% Grade A
────────────────────────────────────────
分类网格（6列，激活色 #ff3300）
────────────────────────────────────────
筛选行 + Skills 网格（3列）
  每张卡片：分类徽章 · Grade 徽章 · 标题 · 描述 · 作者 · 安装数 · 评分
  Hover：显示"安装 →"按钮
```

### 4.2 Skills 列表页（`/skills`）

现有筛选功能基础上新增：
- Grade 筛选（A / B / C / 全部）
- 搜索框移至页面顶部显著位置

### 4.3 Skill 详情页（`/skills/[id]`）

```
面包屑导航
────────────
主栏（左）：
  徽章行（分类 · 类型 · Grade · 版本号）
  标题 + 描述
  统计（安装数 · 评分 · 评论数）
  安装方式 Tab（Claude Code / 复制内容 / 下载文件）
  Skill 内容预览（可展开）
  版本历史列表
  用户评价列表

侧栏（右）：
  作者信息（头像 · 名称 · 主页链接）
  安全评级详情（Grade 大字 + 扫描条目）
  兼容 AI 标签
  相关 Skills（3条）
```

### 4.4 作者主页（`/authors/[username]`）

```
英雄区：头像 · 姓名 · handle · 简介 · 关注按钮
统计行：Skills数 · 总安装 · 平均评分 · 关注者

主栏：Skills 2×N 网格 + 近期活动时间线
侧栏：贡献分布 · 成就徽章 · 擅长领域
```

---

## 5. 数据库扩展

在现有 Prisma schema 基础上新增/修改：

```prisma
// Skill 表新增字段
model Skill {
  // ...现有字段...
  securityGrade   SecurityGrade @default(PENDING)
  securityNotes   Json?
  version         String        @default("1.0.0")
  versions        SkillVersion[]
}

enum SecurityGrade {
  A
  B
  C
  PENDING
}

// 新增版本历史表
model SkillVersion {
  id          String   @id @default(cuid())
  skillId     String
  version     String
  changelog   String
  createdAt   DateTime @default(now())
  skill       Skill    @relation(fields: [skillId], references: [id])
}

// User 表新增字段
model User {
  // ...现有字段...
  bio         String?
  followedBy  Follow[] @relation("following")
  following   Follow[] @relation("follower")
}

// 新增关注关系表
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User     @relation("follower", fields: [followerId], references: [id])
  following   User     @relation("following", fields: [followingId], references: [id])
  @@unique([followerId, followingId])
}
```

---

## 6. 新增 API 路由

| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/authors/[username]` | 获取作者信息 + 统计 |
| GET | `/api/authors/[username]/skills` | 获取作者发布的 Skills |
| POST | `/api/users/[id]/follow` | 关注/取消关注 |
| GET | `/api/skills/[id]/versions` | 获取版本历史 |
| POST | `/api/skills/[id]/versions` | 创建新版本记录 |
| GET | `/api/skills/[id]/related` | 获取相关推荐 Skills |
| PATCH | `/api/admin/skills/[id]/grade` | 设置安全评级（Admin） |

---

## 7. 实施顺序（核心路径优先）

**阶段 1：设计系统 + 数据库**
- 建立 CSS 变量系统（明暗模式）
- 安装 `next-intl`，创建语言文件框架
- 执行 Prisma schema 迁移（新增字段和表）
- 更新全局字体引入（Archivo Black + Space Grotesk + JetBrains Mono）

**阶段 2：首页重设计**
- 搜索优先英雄区
- 分类网格（激活色改为红色）
- Skills 卡片含 Grade 徽章
- 明暗模式切换按钮

**阶段 3：Skills 列表页升级**
- 新增 Grade 筛选器
- 更新卡片样式

**阶段 4：Skill 详情页重构**
- 安装命令 Tab 组件（一键复制）
- 版本历史组件
- 相关推荐组件
- 右侧安全评级面板

**阶段 5：作者主页（新页面）**
- `/authors/[username]` 页面
- 关注功能
- 近期活动时间线
- 贡献统计组件

**阶段 6：管理后台扩展**
- 安全评级设置面板
- 版本管理界面

**阶段 7：国际化收尾**
- 补全所有 UI 文本的中英翻译
- 语言切换路由逻辑

---

## 8. 技术选型补充

| 需求 | 方案 |
|------|------|
| 国际化 | `next-intl` |
| 明暗模式 | CSS 变量 + `data-theme` + `next-themes` |
| 字体 | Google Fonts（Archivo Black、Space Grotesk、JetBrains Mono） |
| 复制到剪贴板 | `navigator.clipboard.writeText()` |
| 相关推荐 | 服务端计算（同分类 + 安装数排序） |
| 安全评级 MVP | 管理员手动在后台设置 |
