# DatingImage MVP — 数据库 & 安全 Review 报告

**Review 日期:** 2026-06-01  
**Review 人:** 数据库架构师 + 安全工程师  
**PRD 版本:** v1.0 (Draft)  
**现有基础:** Supabase Postgres + RLS, private_items / content_blog_posts / content_blog_post_comments, set_updated_at() 触发器

---

## 0. 执行摘要 (Executive Summary)

PRD 的数据库设计整体方向正确，能满足 MVP 核心需求，但存在 **9 类中等及以上风险**，主要集中在：
- **积分扣减非原子化** → 并发超扣风险
- **RLS 策略缺失 + 业务层绕过隐患**
- **public_url 硬存有时效性 URL** → 链接失效、隐私泄露
- **无软删除 + 无数据保留策略** → GDPR/CCPA 合规缺口
- **关键索引缺失** → 画廊页、Dashboard 查询性能隐患

**建议:** 在 Phase 1 数据库迁移阶段一次性修复，避免上线后数据修补成本剧增。

---

## 1. Schema 设计

### 1.1 现状评估

| 表 | 评估 | 风险等级 |
|---|---|---|
| `profiles` | 基本可用，缺少 `deleted_at` / `email` 冗余 | 🟡 Medium |
| `photo_projects` | `scene` 用 text 无约束，`status` 无索引 | 🟡 Medium |
| `generated_photos` | `public_url` 存时效性 URL 是设计缺陷 | 🔴 High |
| `credit_transactions` | 无 `balance_after`，审计追溯困难 | 🟡 Medium |

### 1.2 具体问题 & 修改建议

#### ❌ 问题 1.2.1: `profiles.credits` 无非负约束 + 无并发保护

```sql
-- PRD 现状
credits integer NOT NULL DEFAULT 10
```

**风险:** 并发扣减时可能出现负数；应用层校验可被绕过（直接调 API）。

**建议修改:**
```sql
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_credits_non_negative CHECK (credits >= 0);

-- 使用数据库级原子扣减（见第 3 节事务设计）
```

#### ❌ 问题 1.2.2: `photo_projects.scene` 无 CHECK / ENUM 约束

```sql
-- PRD 现状
scene text NOT NULL
```

**风险:** 应用层拼写错误导致查询不匹配；非法场景入库。

**建议修改:**
```sql
-- 方案 A：自定义 ENUM（推荐，省空间、快比较）
CREATE TYPE public.photo_scene AS ENUM (
  'beach_waterfront',
  'coffee_shop',
  'professional_office',
  'urban_street',
  'outdoor_adventure',
  'art_gallery',
  'wine_bar',
  'gym_fitness'
);

ALTER TABLE public.photo_projects
  ALTER COLUMN scene TYPE public.photo_scene USING scene::photo_scene;

-- 方案 B：如需动态增删场景，改用 CHECK + 配置表
-- CREATE TABLE public.scenes (id text PRIMARY KEY, ...);
-- ALTER TABLE photo_projects ADD CONSTRAINT fk_scene
--   FOREIGN KEY (scene) REFERENCES public.scenes(id);
```

#### ❌ 问题 1.2.3: `generated_photos.public_url` 存 EvoLink 临时 URL

```sql
-- PRD 现状
public_url text NOT NULL
```

**风险:**
- EvoLink 返回的 `public_url` 通常带 **有效期（如 1h~24h）**，硬存到数据库后链接会失效
- 用户分享 gallery 链接后，其他时间访问会 403/404
- 临时 URL 含签名 token，泄露后可在有效期内被任意访问

**建议修改:**
```sql
-- 1. 改名/重构字段语义
ALTER TABLE public.generated_photos
  DROP COLUMN IF EXISTS public_url,
  ADD COLUMN evolink_image_id text,          -- EvoLink 的任务/图片 ID
  ADD COLUMN storage_path text NOT NULL,      -- Supabase Storage 路径（唯一真相源）
  ADD COLUMN storage_bucket text NOT NULL DEFAULT 'generated';

-- 2. 应用层通过 Supabase Storage API 实时创建 signed URL（可设 1h~7d 有效期）
--    或者对低风险图片使用 public bucket + 随机路径
--    示例：supabase.storage.from('generated').createSignedUrl(path, 3600)
```

#### ❌ 问题 1.2.4: `credit_transactions` 缺余额快照字段

```sql
-- PRD 现状
amount integer NOT NULL  -- 正/负记录变动
```

**风险:** 无 `balance_after` 时，审计纠纷、对账、debug 都需全量重算。

**建议修改:**
```sql
ALTER TABLE public.credit_transactions
  ADD COLUMN balance_after integer NOT NULL DEFAULT 0;

-- 触发器自动计算（或事务内计算后写入）
-- 见第 3 节事务设计
```

#### ❌ 问题 1.2.5: `photo_projects` 缺 `deleted_at` (soft delete)

**风险:** 用户误删后无法恢复；GDPR "删除权" 与业务数据保留冲突；关联照片级联物理删除后无法追溯。

**建议修改:**
```sql
ALTER TABLE public.photo_projects
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- 级联到 generated_photos（见第 6 节）
```

---

## 2. RLS 策略完备性

### 2.1 现状评估

| 表 | SELECT | INSERT | UPDATE | DELETE | 风险 |
|---|---|---|---|---|---|
| `profiles` | ✅ | ❌ | ✅ | ❌ | 无 INSERT 策略（依赖 trigger/function） |
| `photo_projects` | ✅ | ✅ | ✅ | ✅ | `UPDATE` 无 `WITH CHECK`，无场景锁定 |
| `generated_photos` | ✅ | ✅ | ❌ | ✅ | 无 `UPDATE` 策略；无 `project_id` 归属校验 |
| `credit_transactions` | ✅ | ❌ | ❌ | ❌ | 无 INSERT/UPDATE/DELETE（依赖 service_role） |

### 2.2 具体问题 & 修改建议

#### ❌ 问题 2.2.1: `generated_photos` INSERT 策略仅校验 `user_id`，不校验 `project_id` 归属

```sql
-- PRD 现状
CREATE POLICY generated_photos_insert ON public.generated_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**风险:** 恶意用户可往他人 project 中插入照片（只要伪造正确的 user_id 即可，但 user_id 本身是 auth.uid()，所以实际上用户只能用自己的 user_id 插入。但问题是：用户可以往自己任意 project_id 插入，哪怕这个 project_id 不属于自己，如果 project_id 被篡改或枚举）。

更严重的：**如果 service_role key 泄露**，无任何防御。

**建议修改:**
```sql
-- 增加 project_id 归属校验 + 禁止用户直接 UPDATE（仅 service_role / 触发器写）
DROP POLICY IF EXISTS generated_photos_insert ON public.generated_photos;

CREATE POLICY generated_photos_insert ON public.generated_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.photo_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- UPDATE：建议禁止终端用户 UPDATE，只允许 service_role / Edge Function
CREATE POLICY generated_photos_update ON public.generated_photos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### ❌ 问题 2.2.2: `photo_projects` UPDATE 策略无 `WITH CHECK`

```sql
-- PRD 现状
CREATE POLICY photo_projects_update ON public.photo_projects
  FOR UPDATE USING (auth.uid() = user_id);
```

**风险:** 用户可将 `user_id` 修改为其他用户 ID（尽管应用层不暴露，但直接调 API 可行）。

**建议修改:**
```sql
DROP POLICY IF EXISTS photo_projects_update ON public.photo_projects;

CREATE POLICY photo_projects_update ON public.photo_projects
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);  -- 防止篡改 user_id
```

#### ❌ 问题 2.2.3: `credit_transactions` 无 INSERT 策略 → 只能 service_role 写

```sql
-- PRD 现状
-- 只有 SELECT policy
```

**风险:** 这是设计意图（积分变动应由服务端原子函数完成），但需明确文档化。建议加一层防护：**只允许 service_role 和 authenticated 用户通过 SECURITY DEFINER 函数写，禁止直接 INSERT。**

**建议修改:**
```sql
-- 禁止所有直接 INSERT（通过应用层函数 / Edge Function 操作）
CREATE POLICY credit_transactions_insert ON public.credit_transactions
  FOR INSERT
  WITH CHECK (false);  -- 默认拒绝，实际通过 set_config('app.bypass_rls', ...) 或 service_role

-- 更优方案：写一个 SECURITY DEFINER 函数 handle_credit_change()
-- 函数内绕过 RLS 执行 INSERT + UPDATE profiles，外层用户无直接写权限
```

#### ❌ 问题 2.2.4: `profiles` 无 INSERT 策略 — auth.users 同步问题

```sql
-- PRD 现状
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

**风险:** `profiles` 行如何创建？PRD 未说明。通常通过 Supabase Auth Trigger `on auth.user created` 自动插入，或应用层首次访问时 upsert。若未处理好，新用户登录后无 profile 行，查询报错。

**建议修改:**
```sql
-- 方案 A：数据库 trigger（推荐，100% 可靠）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, credits)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    10  -- 注册赠送积分
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 方案 B：允许用户自己 INSERT 自己（如用 Edge Function）
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### ❌ 问题 2.2.5: `private_items` SELECT 策略是 `USING (TRUE)` — 与 DatingImage 隐私模型冲突

**注意:** 这是**现有表**的策略，不是 PRD 新表。但若 DatingImage 有任何数据误入此表，或新功能复用此模式，会泄露。

**建议:** 新功能不要复用 `private_items` 的 `SELECT ALL` 模式；若 `private_items` 已废弃，考虑清理或重命名避免误用。

---

## 3. 积分系统事务设计（原子性）

### 3.1 现状评估

PRD 中积分扣减描述：
> "生成前 Server Action 校验积分，防止透支"

这是**应用层校验**，非数据库原子操作。并发场景下存在 **TOCTOU (Time-of-Check to Time-of-Use)** 竞态条件。

### 3.2 风险场景

```
用户余额: 8 credits

T1: 请求 A 校验余额 >= 8 → 通过
T2: 请求 B 校验余额 >= 8 → 通过（A 还未扣减）
T1: 扣减 8 → 余额 0，创建项目
T2: 扣减 8 → 余额 -8，创建项目 ❌ 透支
```

### 3.3 建议修改：数据库级原子扣减函数

```sql
-- 核心原则：所有积分变动通过此函数完成，禁止直接 UPDATE profiles / INSERT credit_transactions

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL
)
RETURNS integer  -- 返回扣减后的余额
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits integer;
  v_new_balance integer;
BEGIN
  -- 1. 原子锁定用户行（FOR UPDATE 阻止并发修改）
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 2. 校验余额（数据库级最终防线）
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_current_credits, p_amount;
  END IF;

  -- 3. 计算新余额
  v_new_balance := v_current_credits - p_amount;

  -- 4. 扣减积分
  UPDATE public.profiles
  SET credits = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  -- 5. 记录交易（含余额快照）
  INSERT INTO public.credit_transactions (
    user_id, amount, type, description, project_id, balance_after
  ) VALUES (
    p_user_id, -p_amount, p_type, p_description, p_project_id, v_new_balance
  );

  RETURN v_new_balance;
END;
$$;

-- 配套：增加积分函数
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount, updated_at = now()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  INSERT INTO public.credit_transactions (
    user_id, amount, type, description, balance_after
  ) VALUES (
    p_user_id, p_amount, p_type, p_description, v_new_balance
  );

  RETURN v_new_balance;
END;
$$;
```

### 3.4 调用方式

```typescript
// Server Action / Edge Function 内调用
const { data: newBalance, error } = await supabase.rpc('deduct_credits', {
  p_user_id: userId,
  p_amount: 8,
  p_type: 'generation',
  p_description: 'Generate 8 photos for project',
  p_project_id: projectId
});

if (error) {
  // 余额不足或系统错误，整个事务已回滚，无脏数据
  throw new Error(error.message);
}

// 扣减成功后再调用 EvoLink API
evolinkTask = await createEvolinkTask(...);
```

### 3.5 配套 Schema 修改

```sql
-- 确保 credits 非负（函数已校验，再加约束兜底）
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_credits_non_negative CHECK (credits >= 0);

-- credit_transactions 增加 balance_after
ALTER TABLE public.credit_transactions
  ADD COLUMN balance_after integer NOT NULL DEFAULT 0;
```

---

## 4. 图片 URL 存储安全性

### 4.1 问题核心

PRD 设计：`generated_photos.public_url` 存储 EvoLink 返回的 URL。

**EvoLink（及同类 AI 图片 API）的 URL 特征：**
- 通常是 **pre-signed URL**，有效期有限（1 小时 ~ 7 天）
- 含签名参数（`?signature=xxx`），泄露后可在有效期内被未授权访问
- 不支持自定义 CORS / 防盗链

### 4.2 建议架构

```
用户上传原图              EvoLink 生成结果
     │                         │
     ▼                         ▼
Supabase Storage          EvoLink CDN
(uploads bucket)          (临时 URL)
     │                         │
     │    1. 下载到应用层/Edge   │
     │◄────────────────────────┘
     │
     ▼
Supabase Storage
(generated bucket)  ← 永久存储，随机路径
     │
     ▼
应用层按需生成 signed URL / public URL
```

### 4.3 具体 Schema & RLS 调整

```sql
-- 重构 generated_photos 表
ALTER TABLE public.generated_photos
  DROP COLUMN IF EXISTS public_url,
  ADD COLUMN evolink_image_id text,
  ADD COLUMN storage_bucket text NOT NULL DEFAULT 'generated',
  ADD COLUMN storage_path text NOT NULL,
  ADD COLUMN is_moderation_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN moderation_reason text;

-- 确保 storage_path 全局唯一（防止覆盖）
ALTER TABLE public.generated_photos
  ADD CONSTRAINT generated_photos_storage_path_unique UNIQUE (storage_bucket, storage_path);

-- Storage bucket RLS 策略（关键！）
-- uploads bucket: 用户只能读写自己的文件
-- generated bucket: 用户只能读自己的文件，写权限仅服务角色
```

### 4.4 Supabase Storage 策略建议

```sql
-- uploads bucket（用户上传原图）
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- generated bucket（AI 生成结果）
CREATE POLICY "Users can read own generated photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated'
  AND EXISTS (
    SELECT 1 FROM public.generated_photos gp
    JOIN public.photo_projects pp ON gp.project_id = pp.id
    WHERE gp.storage_path = storage.objects.name
    AND pp.user_id = auth.uid()
  )
);

-- generated bucket 写入：仅 service_role / Edge Function
```

### 4.5 URL 生成策略对比

| 方案 | 优点 | 缺点 | 适用场景 |
|---|---|---|---|
| **Signed URL (1h)** | 最安全，可控有效期 | 需后端生成，有计算开销 | 下载、分享（短期） |
| **Public URL + 随机路径** | 简单，CDN 友好 | 路径泄露 = 永久访问 | 低敏感图片 |
| **Proxy API (`/api/images/[id]`)** | 可审计、可限速、可随时撤销 | 额外延迟、流量成本 | 高安全需求 |

**MVP 推荐:** `Signed URL`（1~24h）用于 gallery 展示和下载；`public bucket + 随机路径` 作为备选（如需要直接嵌入）。

---

## 5. Soft Delete & 数据保留策略

### 5.1 现状

PRD 无 soft delete 设计，`ON DELETE CASCADE` 导致物理级联删除。

### 5.2 风险

- 用户误删项目后无法恢复
- GDPR "删除权" 要求彻底删除，但业务需要保留交易记录用于审计/对账
- 物理删除后无法调查投诉或滥用行为

### 5.3 建议修改

```sql
-- 1. 项目表增加软删除
ALTER TABLE public.photo_projects
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid REFERENCES auth.users(id);

-- 2. 照片表增加软删除
ALTER TABLE public.generated_photos
  ADD COLUMN deleted_at timestamptz;

-- 3. RLS 自动过滤已删除记录
DROP POLICY IF EXISTS photo_projects_select ON public.photo_projects;
CREATE POLICY photo_projects_select ON public.photo_projects
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS generated_photos_select ON public.generated_photos;
CREATE POLICY generated_photos_select ON public.generated_photos
  FOR SELECT USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.photo_projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

-- 4. 软删除函数（非物理 DELETE）
CREATE OR REPLACE FUNCTION public.soft_delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 校验归属
  IF NOT EXISTS (
    SELECT 1 FROM public.photo_projects
    WHERE id = p_project_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  -- 软删除照片
  UPDATE public.generated_photos
  SET deleted_at = now()
  WHERE project_id = p_project_id;

  -- 软删除项目
  UPDATE public.photo_projects
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = p_project_id;
END;
$$;

-- 5. 数据保留策略（文档化，后续可用 pg_cron 自动化）
--    - 已删除项目：保留 30 天后清理 Storage 文件，DB 记录保留 90 天
--    - credit_transactions：永久保留（审计需求）
--    - 用户注销：profile 匿名化，projects 标记为 archived，180 天后物理删除
```

### 5.4 数据保留策略文档

| 数据类型 | 保留策略 | 实现方式 |
|---|---|---|
| 活跃项目 & 照片 | 直到用户删除 | — |
| 已删除项目 | DB 记录 90 天，Storage 文件 30 天 | soft_delete + 定时清理任务 |
| 积分交易 | 永久 | 不可删除，仅追加 |
| 用户上传原图 | 生成完成后 7 天自动清理 | Edge Function 定时任务 |
| 注销用户数据 | 匿名化后 180 天物理删除 | `profiles.anonymized_at` + 定时任务 |

---

## 6. 外键关系 & 级联删除

### 6.1 现状评估

```sql
-- PRD 设计
photo_projects.user_id → auth.users(id) ON DELETE CASCADE
generated_photos.project_id → photo_projects(id) ON DELETE CASCADE
generated_photos.user_id → auth.users(id) ON DELETE CASCADE
credit_transactions.project_id → photo_projects(id) ON DELETE SET NULL
```

### 6.2 问题分析

| 关系 | 现状 | 评估 |
|---|---|---|
| `photo_projects → auth.users` CASCADE | 用户注销 → 项目全删 | 🟡 可能过度，建议改为 SET NULL + soft delete |
| `generated_photos → photo_projects` CASCADE | 项目删除 → 照片全删 | 🔴 物理删除丢失记录，建议软删除 |
| `generated_photos → auth.users` CASCADE | 冗余外键，已受 project 保护 | 🟡 可以保留，但非必要 |
| `credit_transactions → photo_projects` SET NULL | 项目删除后交易记录保留 | ✅ 正确 |

### 6.3 建议修改

```sql
-- 1. 用户注销时不物理删除项目（改为归档）
-- 移除 CASCADE，或增加中间状态
-- ALTER TABLE public.photo_projects
--   DROP CONSTRAINT photo_projects_user_id_fkey,
--   ADD CONSTRAINT photo_projects_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
-- 注意：Supabase auth.users 删除时，SET NULL 会让 user_id 为空，但 RLS 依赖 user_id = auth.uid()
-- 因此更优方案：ON DELETE CASCADE 保留，但先触发软删除归档

-- 2. 更优方案：auth.user 删除时触发归档（非物理删除）
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger AS $$
BEGIN
  -- 归档所有项目（标记 deleted_at + anonymized）
  UPDATE public.photo_projects
  SET deleted_at = now(), title = '[deleted]', user_id = NULL
  WHERE user_id = old.id;

  -- anonymize profile
  UPDATE public.profiles
  SET display_name = '[deleted]', avatar_url = NULL, email = NULL
  WHERE id = old.id;

  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

-- 3. generated_photos 移除 user_id 冗余（或保留但加注释说明用途）
-- user_id 是反规范化字段，可加速查询但增加维护成本
-- 建议保留（查询性能），但通过触发器或应用层保证与 project.user_id 一致
```

### 6.4 一致性约束建议

```sql
-- 确保 generated_photos.user_id 与所属 project 的 user_id 一致
CREATE OR REPLACE FUNCTION public.validate_photo_ownership()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id != (
    SELECT user_id FROM public.photo_projects WHERE id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'generated_photos.user_id must match photo_projects.user_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_photo_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.generated_photos
  FOR EACH ROW EXECUTE FUNCTION public.validate_photo_ownership();
```

---

## 7. 索引优化

### 7.1 PRD 缺失的关键索引

```sql
-- 当前 PRD 只有主键索引，无业务查询索引
```

### 7.2 建议索引清单

```sql
-- ============================================
-- 1. photo_projects 索引
-- ============================================

-- Dashboard: 查询用户项目列表（按时间倒序）
CREATE INDEX idx_photo_projects_user_id_created_at
  ON public.photo_projects (user_id, created_at DESC)
  WHERE deleted_at IS NULL;  -- partial index，仅索引活跃项目

-- Dashboard: 按状态筛选（如只看 generating）
CREATE INDEX idx_photo_projects_user_id_status
  ON public.photo_projects (user_id, status)
  WHERE deleted_at IS NULL;

-- Webhook 查询：EvoLink 回调时通过 project_id 查状态
CREATE INDEX idx_photo_projects_id_status
  ON public.photo_projects (id, status);

-- ============================================
-- 2. generated_photos 索引
-- ============================================

-- Gallery 页：查询项目下所有照片（按顺序）
CREATE INDEX idx_generated_photos_project_id_sort
  ON public.generated_photos (project_id, sort_order)
  WHERE deleted_at IS NULL;

-- 用户所有照片（如全局画廊、管理后台）
CREATE INDEX idx_generated_photos_user_id_created
  ON public.generated_photos (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Storage 路径唯一查找（清理任务用）
CREATE INDEX idx_generated_photos_storage_path
  ON public.generated_photos (storage_bucket, storage_path);

-- ============================================
-- 3. credit_transactions 索引
-- ============================================

-- 用户交易记录（按时间倒序）
CREATE INDEX idx_credit_transactions_user_id_created
  ON public.credit_transactions (user_id, created_at DESC);

-- 按项目查交易（退款/审计）
CREATE INDEX idx_credit_transactions_project_id
  ON public.credit_transactions (project_id)
  WHERE project_id IS NOT NULL;

-- 按类型查交易（统计用）
CREATE INDEX idx_credit_transactions_type_created
  ON public.credit_transactions (type, created_at DESC);

-- ============================================
-- 4. profiles 索引
-- ============================================
-- 主键即索引，一般无需额外索引
-- 如按 credits 排序（排行榜），可加：
-- CREATE INDEX idx_profiles_credits ON public.profiles (credits DESC);
```

### 7.3 索引维护说明

- 使用 `CONCURRENTLY` 在线创建索引（生产环境避免锁表）
- 定期运行 `ANALYZE` 更新统计信息
- MVP 初期数据量小，可先创建核心索引，后续根据 `pg_stat_statements` 慢查询日志补充

---

## 8. 数据迁移方案

### 8.1 迁移原则

- **零停机迁移**：使用 `IF NOT EXISTS` / `IF EXISTS` + `CREATE OR REPLACE`
- **幂等性**：迁移脚本可重复执行不报错
- **回滚能力**：每个 migration 包含 Down 脚本（注释形式）
- **测试覆盖**：pgTap 测试验证 schema 状态

### 8.2 推荐迁移文件结构

```
apps/database/supabase/migrations/
├── 20230208104717_init.sql              ← 已有
├── 20230208104718_private_items.sql     ← 已有
├── ...                                  ← 已有
├── 20250601000000_datingimage_schema.sql  ← 新增：核心表 + RLS
├── 20250601000001_datingimage_functions.sql ← 新增：积分函数 + 触发器
├── 20250601000002_datingimage_indexes.sql   ← 新增：性能索引
└── tests/
    └── database_test.sql                ← 更新：增加新表测试
```

### 8.3 核心迁移脚本模板

```sql
-- 20250601000000_datingimage_schema.sql
-- Up: DatingImage MVP Schema

-- 1. 创建 profiles 表（如不存在）
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  credits integer NOT NULL DEFAULT 10 CONSTRAINT profiles_credits_non_negative CHECK (credits >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 触发器
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. 创建 photo_projects 表
CREATE TABLE IF NOT EXISTS public.photo_projects (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Project',
  scene public.photo_scene NOT NULL,  -- 需先创建 ENUM
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'queued', 'generating', 'completed', 'failed', 'cancelled')),
  photo_count integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);

-- 触发器 + RLS + 索引（同上模式）

-- 3. 创建 generated_photos 表
CREATE TABLE IF NOT EXISTS public.generated_photos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.photo_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'generated',
  storage_path text NOT NULL,
  evolink_image_id text,
  prompt text,
  sort_order integer NOT NULL DEFAULT 0,
  is_moderation_flagged boolean NOT NULL DEFAULT false,
  moderation_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted_at timestamptz,
  CONSTRAINT generated_photos_storage_path_unique UNIQUE (storage_bucket, storage_path)
);

-- 4. 创建 credit_transactions 表
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('signup_bonus', 'generation', 'purchase', 'refund', 'referral')),
  description text,
  project_id uuid REFERENCES public.photo_projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- RLS：禁止直接写入，仅允许 SELECT
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_transactions_select ON public.credit_transactions;
DROP POLICY IF EXISTS credit_transactions_insert ON public.credit_transactions;
CREATE POLICY credit_transactions_select ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY credit_transactions_insert ON public.credit_transactions FOR INSERT WITH CHECK (false);

-- 5. 新用户自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, credits)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    10
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Down migration (注释保留)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- ...（略）
```

### 8.4 现有数据兼容

- `private_items` / `content_blog_posts` / `content_blog_post_comments` **不受影响**
- 新表使用 `IF NOT EXISTS` 避免冲突
- `set_updated_at()` 函数已存在，直接复用

---

## 9. 合规性：隐私 & GDPR/CCPA

### 9.1 合规检查清单

| 要求 | PRD 现状 | 达标？ | 建议 |
|---|---|---|---|
| **数据最小化** | 仅收集必要数据（照片、场景、积分） | ✅ | 保留 |
| **用户访问权** | RLS 保证用户只看自己数据 | ✅ | 保留 |
| **更正权** | profile 可更新 | ✅ | 保留 |
| **删除权 (Right to Erasure)** | 物理 CASCADE 删除 | 🔴 | 改为软删除 + 异步清理 |
| **可携带权** | 无数据导出功能 | 🟡 | MVP 后可加 `/api/export` |
| **处理记录** | credit_transactions 有审计 | ✅ | 保留 |
| **儿童保护 (COPPA)** | 无年龄验证 | 🟡 | 建议 TOS 声明 18+ |
| **照片隐私** | 原图存 Storage，AI 结果存 Storage | 🟡 | 需加密 + 访问日志 |

### 9.2 具体合规建议

#### A. 用户注销流程（GDPR Article 17）

```sql
-- 不物理删除，先匿名化 + 软删除
CREATE OR REPLACE FUNCTION public.anonymize_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. 匿名化 profile
  UPDATE public.profiles
  SET display_name = '[deleted]',
      avatar_url = NULL,
      email = NULL,  -- 如需冗余存储
      credits = 0,
      updated_at = now()
  WHERE id = p_user_id;

  -- 2. 软删除所有项目
  UPDATE public.photo_projects
  SET title = '[deleted]',
      deleted_at = now(),
      deleted_by = p_user_id
  WHERE user_id = p_user_id;

  -- 3. 软删除所有照片记录
  UPDATE public.generated_photos
  SET deleted_at = now()
  WHERE user_id = p_user_id;

  -- 4. 标记 auth.users 为待清理（如 Supabase 不自动删）
  -- 实际 auth.users 删除由 Supabase Admin API 处理
END;
$$;
```

#### B. 照片数据加密

- **传输中:** Supabase 强制 HTTPS ✅
- **静态加密:** Supabase Storage 默认 AES-256 ✅
- **额外保护:** 对敏感原图在上传前做客户端加密（可选，MVP 后迭代）

#### C. 访问日志

```sql
-- 建议增加操作日志表（MVP 后可加）
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,  -- 'project_created', 'photo_downloaded', 'credits_deducted'
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- RLS: 用户只能看自己的，admin 可看全部
```

#### D. 同意记录

- 注册即表示同意 TOS / Privacy Policy
- 建议在 `profiles` 增加：
```sql
ALTER TABLE public.profiles
  ADD COLUMN tos_accepted_at timestamptz,
  ADD COLUMN privacy_policy_accepted_at timestamptz;
```

---

## 10. 其他安全建议

### 10.1 Webhook 安全

PRD 提到："验证 EvoLink 回调签名"

**建议具体实现:**
```typescript
// /api/webhooks/evolink
const signature = req.headers['x-evolink-signature'];
const payload = await req.text();
const expected = crypto
  .createHmac('sha256', process.env.EVOLINK_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
  return new Response('Unauthorized', { status: 401 });
}

// 再校验 payload 中的 project_id 存在且状态为 generating
```

### 10.2 Rate Limiting

PRD: "每用户每小时最多 5 次生成（预留）"

**建议实现:**
```sql
-- 使用 Redis / Upstash 在 Server Action 层限制
-- 或数据库级滑动窗口（简单但性能一般）

CREATE TABLE public.rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0
);
```

### 10.3 图片 Moderation

EvoLink 自带 moderation 是第一步，但建议增加二次校验：
- 对返回图片用 AWS Rekognition / Google Vision API 做 NSFW 检测
- 标记 `is_moderation_flagged`，人工复核后才展示

```sql
ALTER TABLE public.generated_photos
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected'));
```

---

## 11. 修改优先级汇总

| 优先级 | 问题 | 影响 | 阶段 |
|---|---|---|---|
| **P0 (阻塞)** | 积分扣减非原子化 | 并发超扣，资金损失 | Phase 1 |
| **P0 (阻塞)** | `public_url` 存临时 URL | 链接失效、隐私泄露 | Phase 1 |
| **P1 (高)** | RLS UPDATE 无 WITH CHECK | 用户可篡改 user_id | Phase 1 |
| **P1 (高)** | `generated_photos` INSERT 不校验 project 归属 | 照片注入风险 | Phase 1 |
| **P1 (高)** | 无 soft delete | 数据丢失、合规缺口 | Phase 1 |
| **P2 (中)** | `profiles` 无自动创建机制 | 新用户 500 错误 | Phase 1 |
| **P2 (中)** | `scene` 无 ENUM/CHECK | 数据完整性 | Phase 1 |
| **P2 (中)** | 关键索引缺失 | 查询性能劣化 | Phase 1/2 |
| **P3 (低)** | audit_logs / 访问日志 | 安全审计 | Phase 3+ |
| **P3 (低)** | 数据保留自动化清理 | 存储成本 | Phase 3+ |

---

## 12. 推荐最终 Schema（修正版）

```sql
-- ============================================
-- ENUM
-- ============================================
CREATE TYPE public.photo_scene AS ENUM (
  'beach_waterfront', 'coffee_shop', 'professional_office',
  'urban_street', 'outdoor_adventure', 'art_gallery',
  'wine_bar', 'gym_fitness'
);

CREATE TYPE public.project_status AS ENUM (
  'uploading', 'queued', 'generating', 'completed', 'failed', 'cancelled'
);

CREATE TYPE public.transaction_type AS ENUM (
  'signup_bonus', 'generation', 'purchase', 'refund', 'referral'
);

-- ============================================
-- profiles
-- ============================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  credits integer NOT NULL DEFAULT 10 CHECK (credits >= 0),
  tos_accepted_at timestamptz,
  privacy_policy_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================
-- photo_projects
-- ============================================
CREATE TABLE public.photo_projects (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Project',
  scene public.photo_scene NOT NULL,
  status public.project_status NOT NULL DEFAULT 'uploading',
  photo_count integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);

-- ============================================
-- generated_photos
-- ============================================
CREATE TABLE public.generated_photos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.photo_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'generated',
  storage_path text NOT NULL,
  evolink_image_id text,
  prompt text,
  sort_order integer NOT NULL DEFAULT 0,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),
  moderation_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted_at timestamptz,
  CONSTRAINT generated_photos_storage_path_unique UNIQUE (storage_bucket, storage_path)
);

-- ============================================
-- credit_transactions
-- ============================================
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  type public.transaction_type NOT NULL,
  description text,
  project_id uuid REFERENCES public.photo_projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================
-- 核心函数
-- ============================================
-- deduct_credits(), add_credits(), soft_delete_project(),
-- handle_new_user(), handle_user_deletion(), validate_photo_ownership()
-- （详见上文）

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_photo_projects_user_id_created_at ON public.photo_projects(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_photo_projects_user_id_status ON public.photo_projects(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_photos_project_id_sort ON public.generated_photos(project_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_photos_user_id_created ON public.generated_photos(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_credit_transactions_user_id_created ON public.credit_transactions(user_id, created_at DESC);
```

---

*Review 完成。建议将本报告中的 P0/P1 修改纳入 Phase 1 数据库迁移，P2 修改纳入 Phase 2，以确保 MVP 上线时数据安全和合规基线达标。*
