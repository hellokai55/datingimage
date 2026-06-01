# DatingImage — Product Requirements Document

## 1. 产品概述

**DatingImage** 是一个 AI 驱动的约会照片生成器。用户上传自己的自拍照，选择心仪的场景，AI 为其生成多种高质量、自然的约会照片，用于 Tinder、Bumble、Hinge 等约会应用，提升匹配率。

**Slogan:** "8 curated photos. Zero compromise."

**定位：** 不做"80张凑数"的批量工厂，只做 8 张精修级别的约会照片。每张都经过场景化 AI 生成 + 人脸一致性保持，直接可用。

---

## 2. 目标用户

- 20-35 岁单身男女
- 使用约会应用但照片质量不佳
- 没有时间和预算拍专业写真
- 想快速获得多样化、高质量约会照片

---

## 3. 核心价值主张

| 痛点 | 解决方案 |
|---|---|
| 自拍单调、背景杂乱 | AI 生成 8 张精修级约会照片 |
| 拍写真贵、耗时长 | 几分钟出图，成本低 |
| 照片风格单一 | 多种场景一键切换 |
| 竞品给 80 张凑数 | 我们只给 8 张，但每张都可用 |

---

## 4. 核心用户流程

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│ Landing  │───▶│  Login   │───▶│   Upload     │───▶│  Select  │───▶│ Generate │
│  Page    │    │ (Google) │    │  5-10 Selfies│    │  Scene   │    │   & Wait │
└──────────┘    └──────────┘    └──────────────┘    └──────────┘    └──────────┘
                                                                              │
                                                                              ▼
┌──────────┐    ┌──────────┐                                        ┌──────────┐
│ Download │◀───│ Gallery  │◀───────────────────────────────────────│  Result  │
│ (ZIP)    │    │  View    │                                        │  Page    │
└──────────┘    └──────────┘                                        └──────────┘
```

---

## 5. 功能需求

### 5.1 Landing Page (`/`)

- Hero Section：大标题 + **Before/After 对比展示** + CTA 按钮（"免费生成第一张约会照片"）
- How It Works：4 步流程图示（Upload → Select → Generate → Download）
- **Before/After Gallery**：真实生成效果对比（核心转化武器）
- Scene Previews：8 个场景的缩略图预览
- **Trust Signals**："照片仅你可见 · 24h 后删除原图 · 不用于 AI 训练"
- Pricing Teaser：注册免费 15 积分（约 1 次完整生成 + 2 次单张重生成）
- Footer：Links + Copyright

**Auth Gate：** 点击 CTA 后，未登录用户跳转 `/login`

### 5.2 登录 (`/login`)

- Google OAuth 一键登录（Supabase Auth）
- 无密码注册/登录流程
- 登录后跳转 `/dashboard`

### 5.3 Dashboard (`/dashboard`)

- 欢迎语 + 剩余积分显示
- "New Project" 大按钮
- 历史项目列表（卡片网格）
  - 项目缩略图（首张生成图）
  - 场景名称
  - 状态：generating / completed / failed
  - 创建时间
- 空状态：引导创建第一个项目

### 5.4 新建项目 — 上传 (`/project/new`)

- 步骤指示器：Step 1/3 Upload → Step 1.5 Confirm → Step 2/3 Scene → Step 3/3 Generate
- 拖拽上传区域（支持点击选择）
- 限制：5-10 张，JPG/PNG，单张 ≤ 10MB
- **人脸预检**：上传后自动检测是否有人脸、是否过糊、是否多人，不合格阻断并提示
- 实时预览：上传后显示缩略图，可删除重选
- **Step 1.5 确认页**：展示已上传缩略图 + "确认无误，继续选场景" / "重新上传"
- "Next" 按钮 → 进入场景选择

**技术：** 上传至 Supabase Storage `uploads/{user_id}/{project_id}/`，预签名 URL 客户端直传

### 5.5 新建项目 — 场景选择 (`/project/new/scene`)

- 步骤指示器：Step 2/3
- 场景网格（8 个）：
  1. 🏖️ Beach & Waterfront
  2. ☕ Coffee Shop
  3. 💼 Professional Office
  4. 🌆 Urban Street
  5. 🏔️ Outdoor Adventure
  6. 🎨 Art Gallery
  7. 🍷 Wine Bar
  8. 🏋️ Gym & Fitness
- 每个场景：封面图 + 名称 + 简短描述
- 单选，选中高亮
- "Back" / "Generate" 按钮

### 5.6 生成中 (`/project/{id}/generating`)

- 大进度条动画
- 状态文案："Analyzing your photos..." → "Generating scenes..." → "Almost there..."
- 预计时间：2-5 分钟
- 取消按钮

**技术：** 
- 前端轮询 `/api/projects/{id}/status`
- 后端调用 EvoLink API（异步任务）
- 生成完成后 webhook/polling 更新状态

### 5.7 结果画廊 (`/project/{id}`)

- 项目标题 + 场景标签
- 照片网格（2-4 列响应式）
- 每张图片：hover 放大、点击灯箱预览、**下载单张**、**删除单张**
- **"Best for Tinder" 标签**：AI 标注最推荐的 1-2 张
- **"Try Another Scene"**：同一批照片换场景重新生成（消耗额外积分）
- **"Regenerate All"**：同场景全部重新生成（8 张全崩时给用户第二次机会）
- **Before/After 切换**：查看原自拍 vs 生成图对比
- "Create New" → 回到新建项目
- ~~ZIP 打包下载~~（MVP 延后，单张下载足够）
- ~~分享按钮~~（MVP 延后，约会照片隐私敏感）

### 5.8 积分系统

| 操作 | 消耗/获得 |
|---|---|
| 注册 | **+15 credits**（1次完整生成8张 + 2次单张重生成） |
| 每次生成（8 张图） | -8 credits |
| 单张重生成 | -1 credit/张 |
| ~~邀请好友~~ | ~~MVP 移除~~ |
| 生成失败 | **自动退还积分**（信任底线） |

**积分不足：** 弹窗显示"充值即将上线，留下邮箱优先体验"（收集 leads，Stripe 延后集成）

---

## 6. 数据库设计

### 6.1 Schema

```sql
-- 用户资料（扩展 auth.users）
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  credits integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 照片生成项目
CREATE TABLE public.photo_projects (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Project',
  scene text NOT NULL,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'queued', 'generating', 'completed', 'failed', 'cancelled')),
  photo_count integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 生成的照片
CREATE TABLE public.generated_photos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.photo_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  prompt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 积分交易记录
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('signup_bonus', 'generation', 'purchase', 'refund')),
  description text,
  project_id uuid REFERENCES public.photo_projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 触发器：更新 updated_at
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_photo_projects BEFORE UPDATE ON public.photo_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 6.2 RLS 策略

```sql
-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- photo_projects
ALTER TABLE public.photo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY photo_projects_select ON public.photo_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY photo_projects_insert ON public.photo_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY photo_projects_update ON public.photo_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY photo_projects_delete ON public.photo_projects FOR DELETE USING (auth.uid() = user_id);

-- generated_photos
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY generated_photos_select ON public.generated_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY generated_photos_insert ON public.generated_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY generated_photos_delete ON public.generated_photos FOR DELETE USING (auth.uid() = user_id);

-- credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_transactions_select ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
```

---

## 7. API 设计

### 7.1 Server Actions (`next-safe-action`)

| Action | 输入 | 输出 | 说明 |
|---|---|---|---|
| `createProject` | `{ scene: string }` | `{ project: PhotoProject }` | 创建项目，扣除积分 |
| `updateProjectStatus` | `{ projectId, status }` | `{ success }` | 更新项目状态（内部使用）|
| `deductCredits` | `{ amount, type, description }` | `{ credits: number }` | 扣除积分 |
| `deleteProject` | `{ projectId }` | `{ success }` | 删除项目及关联照片 |

### 7.2 Route Handlers

| Endpoint | Method | 说明 |
|---|---|---|
| `/api/projects/[id]/status` | GET | 查询项目生成状态 |
| `/api/projects/[id]/download` | GET | 打包下载 ZIP |
| `/api/webhooks/evolink` | POST | EvoLink 任务完成回调 |
| `/api/upload/presigned` | POST | 获取 Supabase Storage 预签名 URL |

### 7.3 EvoLink API 集成

```typescript
// 创建生成任务
const response = await fetch('https://api.evolink.ai/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${EVOLINK_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-image-2',
    prompt: buildPrompt(scene, userDescription),
    image_urls: uploadedPhotoUrls, // 1-16 张参考图
    size: '1024x1024',
    quality: 'high',
    n: 8, // 生成 8 张
  }),
});

// 轮询任务结果
const result = await fetch(`https://api.evolink.ai/v1/tasks/${taskId}`, {
  headers: { 'Authorization': `Bearer ${EVOLINK_API_KEY}` },
});
```

**Prompt 模板：**
```
Generate a realistic dating profile photo of the person in the reference image(s). 
Scene: {scene_name}. 
Style: Natural, flattering lighting, professional quality, dating-app ready. 
Keep the person's facial features authentic and recognizable.
```

---

## 8. 页面结构

```
app/
├── (external-pages)/
│   ├── page.tsx              # Landing Page
│   └── layout.tsx
├── (auth-pages)/
│   └── login/
│       └── page.tsx          # Google OAuth 登录
├── (app-pages)/
│   ├── layout.tsx            # App shell (sidebar + header)
│   ├── dashboard/
│   │   └── page.tsx          # 项目列表
│   ├── project/
│   │   ├── new/
│   │   │   └── page.tsx      # Step 1: Upload
│   │   ├── new/scene/
│   │   │   └── page.tsx      # Step 2: Scene Selection
│   │   └── [id]/
│   │       ├── page.tsx      # Result Gallery
│   │       └── generating/
│   │           └── page.tsx  # Generating Progress
│   └── settings/
│       └── page.tsx          # Profile + Credits
```

---

## 9. 技术方案

### 9.1 复用现有基础

| 已有能力 | 使用方式 |
|---|---|
| Next.js 16 + App Router | 直接使用 |
| Supabase Auth (Google OAuth) | 直接使用，新增 `profiles` 表扩展 |
| Supabase Storage | 存储用户上传原图 + 生成图片 |
| next-safe-action + Zod | 所有 Server Actions |
| shadcn/ui + Tailwind | 所有 UI 组件 |
| Turborepo + pnpm | 保持 monorepo 结构 |

### 9.2 新增依赖

```json
{
  "jszip": "^3.10.1",
  "file-saver": "^2.0.5"
}
```

### 9.3 环境变量

```
# 已有
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 新增
EVOLINK_API_KEY=
EVOLINK_WEBHOOK_SECRET=
```

---

## 10. 安全设计

- **RLS：** 所有表启用 RLS，用户只能访问自己的数据
- **积分校验：** 生成前 Server Action 校验积分，防止透支
- **上传限制：** 5-10 张，≤10MB/张，仅 JPG/PNG
- **图片审核：** EvoLink API 自带 moderation，敏感内容自动拦截
- **Webhook 签名：** 验证 EvoLink 回调签名
- **Rate Limiting：** 每用户每小时最多 5 次生成（预留）

---

## 11. 部署计划

| 步骤 | 操作 |
|---|---|
| 1 | 本地开发 + 测试 |
| 2 | 推送至 GitHub `main` |
| 3 | Vercel 自动部署 |
| 4 | Supabase 执行迁移 |
| 5 | 配置环境变量（Vercel + Supabase）|
| 6 | 配置 Google OAuth 回调 URL |
| 7 | 域名：`datingimage.vercel.app`（已配置）|

---

## 12. MVP 里程碑

| 阶段 | 内容 | 预估 |
|---|---|---|
| **Phase 1** | 数据库迁移 + RLS + 基础表 | 1 天 |
| **Phase 2** | Auth + Landing Page + Dashboard | 1 天 |
| **Phase 3** | Upload → Scene Selection → Generate Flow | 2 天 |
| **Phase 4** | EvoLink API 集成 + 异步任务 + Gallery | 2 天 |
| **Phase 5** | Credits System + Polish + Bugfix | 1 天 |
| **Phase 6** | Deploy + Test + Launch | 1 天 |

**总计：约 8 天**

---

## 13. 成功指标

- 用户注册 → 项目创建转化率 ≥ 30%
- 项目创建 → 生成完成转化率 ≥ 80%
- 平均生成时间 ≤ 5 分钟
- 生成图片用户满意度 ≥ 4/5

---

*PRD Version: 1.0*  
*Date: 2026-06-01*  
*Status: Draft — Pending Review*
