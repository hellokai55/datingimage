'use server';

import { authActionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createProjectSchema = z.object({
  scene: z.string().min(1),
  uploadPaths: z.array(z.string()).min(1),
});

export const createProjectAction = authActionClient
  .schema(createProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseClient();
    const userId = ctx.userId;

    // 1. Check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const CREDIT_COST = 8;
    if (profile.credits < CREDIT_COST) {
      throw new Error('Insufficient credits');
    }

    // 2. Create project
    const { data: project, error: projectError } = await supabase
      .from('photo_projects')
      .insert({
        user_id: userId,
        scene: parsedInput.scene,
        status: 'queued',
        credits_used: CREDIT_COST,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error('Failed to create project');
    }

    // 3. Deduct credits atomically via RPC
    const { data: newCredits, error: deductError } = await supabase.rpc(
      'deduct_credits',
      {
        p_user_id: userId,
        p_amount: CREDIT_COST,
        p_description: `Generate ${parsedInput.scene} photos`,
        p_project_id: project.id,
        p_type: 'generation',
      }
    );

    if (deductError) {
      // Rollback: delete project if credit deduction failed
      await supabase.from('photo_projects').delete().eq('id', project.id);
      throw new Error(deductError.message);
    }

    // 4. Get signed URLs for uploaded images
    const imageUrls = await Promise.all(
      parsedInput.uploadPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from('uploads')
          .createSignedUrl(path, 3600);
        return data?.signedUrl || '';
      })
    );

    // 5. Call EvoLink API (async — fire and forget for MVP)
    // In production, use a job queue
    try {
      const { createGenerationTask } = await import('@/lib/evolink');
      const task = await createGenerationTask({
        scene: parsedInput.scene,
        imageUrls: imageUrls.filter(Boolean),
      });

      // Update project with task info
      await supabase
        .from('photo_projects')
        .update({
          status: 'generating',
          evolink_task_id: task.id || task.task_id,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min timeout
        })
        .eq('id', project.id);
    } catch (err) {
      // Mark as failed and refund
      await supabase.rpc('fail_project_and_refund', {
        p_project_id: project.id,
        p_reason: err instanceof Error ? err.message : 'EvoLink API error',
      });
      throw new Error('Failed to start generation. Credits have been refunded.');
    }

    revalidatePath('/dashboard');
    return { project: { ...project, status: 'generating' }, credits: newCredits };
  });

const deleteProjectSchema = z.object({
  projectId: z.string().uuid(),
});

export const deleteProjectAction = authActionClient
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseClient();
    const userId = ctx.userId;

    // Soft delete
    const { error } = await supabase
      .from('photo_projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsedInput.projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to delete project');
    }

    revalidatePath('/dashboard');
    return { success: true };
  });

export async function getUserProjects() {
  const supabase = await createSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('photo_projects')
    .select(`
      *,
      generated_photos (
        id,
        storage_path,
        sort_order
      )
    `)
    .eq('user_id', user.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch projects');
  }

  // Generate signed URLs for first generated photo of each completed project
  const projectsWithUrls = await Promise.all(
    (data || []).map(async (project) => {
      const firstPhoto = project.generated_photos?.[0];
      if (firstPhoto?.storage_path) {
        const { data: urlData } = await supabase.storage
          .from('generated')
          .createSignedUrl(firstPhoto.storage_path, 3600);
        return {
          ...project,
          thumbnailUrl: urlData?.signedUrl || '',
        };
      }
      return { ...project, thumbnailUrl: '' };
    })
  );

  return projectsWithUrls;
}

export async function getProjectById(projectId: string) {
  const supabase = await createSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Not authenticated');
  }

  const { data: project, error: projectError } = await supabase
    .from('photo_projects')
    .select(`
      *,
      generated_photos (
        id,
        storage_path,
        sort_order
      )
    `)
    .eq('id', projectId)
    .eq('user_id', user.user.id)
    .is('deleted_at', null)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  // Get signed URLs for generated photos
  const { data: photos } = await supabase
    .from('generated_photos')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.user.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  const photosWithUrls = await Promise.all(
    (photos || []).map(async (photo) => {
      const { data: urlData } = await supabase.storage
        .from('generated')
        .createSignedUrl(photo.storage_path, 3600);
      return {
        ...photo,
        signedUrl: urlData?.signedUrl || '',
      };
    })
  );

  return { ...project, generated_photos: photosWithUrls };
}

export async function getUserProfile() {
  const supabase = await createSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}
