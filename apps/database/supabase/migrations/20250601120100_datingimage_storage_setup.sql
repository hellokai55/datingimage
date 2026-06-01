-- Migration: DatingImage Storage buckets and RLS
-- Created: 2026-06-01

-- ============================================================
-- 1. Create Storage Buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uploads', 'uploads', false, 10485760, ARRAY['image/jpeg', 'image/png']),
  ('generated', 'generated', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Storage RLS Policies — uploads bucket
-- ============================================================
-- Users can read their own uploads
DROP POLICY IF EXISTS "Users can read own uploads" ON storage.objects;
CREATE POLICY "Users can read own uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png')
  );

-- Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 3. Storage RLS Policies — generated bucket
-- ============================================================
-- Users can read their own generated photos
DROP POLICY IF EXISTS "Users can read own generated photos" ON storage.objects;
CREATE POLICY "Users can read own generated photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Service role can write generated photos (webhook / server action)
DROP POLICY IF EXISTS "Service role can write generated photos" ON storage.objects;
CREATE POLICY "Service role can write generated photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated');

-- Users can delete their own generated photos
DROP POLICY IF EXISTS "Users can delete own generated photos" ON storage.objects;
CREATE POLICY "Users can delete own generated photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'generated' AND auth.uid()::text = (storage.foldername(name))[1]);
