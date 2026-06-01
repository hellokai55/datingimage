-- Migration: DatingImage core tables — profiles, projects, generated photos, credits
-- Created: 2026-06-01

-- ============================================================
-- 1. Ensure set_updated_at() exists
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    BEGIN
      NEW.updated_at = timezone('utc', now());
      RETURN NEW;
    END;
    $function$;
  END IF;
END $$;

-- ============================================================
-- 2. Profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  credits integer NOT NULL DEFAULT 15 CHECK (credits >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. Photo Projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.photo_projects (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Project',
  scene text NOT NULL,
  status text NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'queued', 'generating', 'completed', 'failed', 'cancelled')),
  photo_count integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  evolink_task_id text,
  error_message text,
  deleted_at timestamptz,        -- soft delete
  started_at timestamptz,
  expires_at timestamptz,        -- task timeout sentinel
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_photo_projects_user_created
  ON public.photo_projects (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_projects_status_expires
  ON public.photo_projects (status, expires_at)
  WHERE status = 'generating';

CREATE TRIGGER set_updated_at_photo_projects
  BEFORE UPDATE ON public.photo_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. Generated Photos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_photos (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.photo_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  evolink_image_id text,         -- EvoLink task reference for traceability
  prompt text,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,        -- soft delete
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_photos_project_sort
  ON public.generated_photos (project_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_generated_photos_user_project
  ON public.generated_photos (user_id, project_id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 5. Credit Transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount != 0),
  balance_after integer,         -- snapshot for audit
  type text NOT NULL CHECK (type IN ('signup_bonus', 'generation', 'regeneration', 'purchase', 'refund')),
  description text,
  project_id uuid REFERENCES public.photo_projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON public.credit_transactions (user_id, created_at DESC);

-- ============================================================
-- 6. Atomic Credit RPC Functions (SECURITY DEFINER)
-- ============================================================

-- Deduct credits atomically. Returns new balance.
-- Raises 'Insufficient credits' exception if balance < amount.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_type text DEFAULT 'generation'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_credits integer;
BEGIN
  UPDATE public.profiles
  SET credits = credits - p_amount,
      updated_at = timezone('utc', now())
  WHERE id = p_user_id
    AND credits >= p_amount
  RETURNING credits INTO v_new_credits;

  IF v_new_credits IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, type, description, project_id)
  VALUES
    (p_user_id, -p_amount, v_new_credits, p_type, p_description, p_project_id);

  RETURN v_new_credits;
END;
$$;

-- Refund credits atomically (e.g., generation failure).
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_credits integer;
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount,
      updated_at = timezone('utc', now())
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, type, description, project_id)
  VALUES
    (p_user_id, p_amount, v_new_credits, 'refund', p_description, p_project_id);

  RETURN v_new_credits;
END;
$$;

-- Mark project as failed and refund credits in one atomic call.
CREATE OR REPLACE FUNCTION public.fail_project_and_refund(
  p_project_id uuid,
  p_reason text DEFAULT 'Timeout or failure'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project public.photo_projects%ROWTYPE;
BEGIN
  SELECT * INTO v_project
  FROM public.photo_projects
  WHERE id = p_project_id
    AND status IN ('queued', 'generating')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN; -- already handled
  END IF;

  -- Refund if credits were consumed
  IF v_project.credits_used > 0 THEN
    PERFORM public.refund_credits(
      v_project.user_id,
      v_project.credits_used,
      'Refund for failed project: ' || p_reason,
      p_project_id
    );
  END IF;

  UPDATE public.photo_projects
  SET status = 'failed',
      error_message = p_reason,
      updated_at = timezone('utc', now())
  WHERE id = p_project_id;
END;
$$;

-- ============================================================
-- 7. Auto-create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    15
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop if exists to allow re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- photo_projects
ALTER TABLE public.photo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS photo_projects_select ON public.photo_projects
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY IF NOT EXISTS photo_projects_insert ON public.photo_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS photo_projects_update ON public.photo_projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS photo_projects_delete ON public.photo_projects
  FOR DELETE USING (auth.uid() = user_id);

-- generated_photos
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS generated_photos_select ON public.generated_photos
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY IF NOT EXISTS generated_photos_insert ON public.generated_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS generated_photos_delete ON public.generated_photos
  FOR DELETE USING (auth.uid() = user_id);

-- credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS credit_transactions_select ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
