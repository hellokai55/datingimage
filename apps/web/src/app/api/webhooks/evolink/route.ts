import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  // Verify webhook signature (if EvoLink provides one)
  // For MVP, we skip signature verification and rely on idempotency

  const body = await request.json().catch(() => null);
  if (!body || !body.task_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Use service role client for webhook
  const cookieStore = await cookies();
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  // Find project by evolink_task_id
  const { data: project } = await supabase
    .from('photo_projects')
    .select('*')
    .eq('evolink_task_id', body.task_id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('generated_photos')
    .select('id')
    .eq('project_id', project.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ status: 'already_processed' });
  }

  // Handle failure
  if (body.status === 'failed' || !body.images || body.images.length === 0) {
    await supabase.rpc('fail_project_and_refund', {
      p_project_id: project.id,
      p_reason: body.error || 'Generation failed',
    });
    return NextResponse.json({ status: 'failed_and_refunded' });
  }

  // Success: store generated images
  try {
    const images = body.images || [];
    const photoRecords = images.map((img: { url: string }, i: number) => ({
      project_id: project.id,
      user_id: project.user_id,
      storage_path: img.url, // In MVP, store EvoLink URL directly (with TTL handling)
      evolink_image_id: `${body.task_id}_${i}`,
      sort_order: i,
    }));

    const { error: insertError } = await supabase
      .from('generated_photos')
      .insert(photoRecords);

    if (insertError) throw insertError;

    // Update project status
    await supabase
      .from('photo_projects')
      .update({
        status: 'completed',
        photo_count: images.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    return NextResponse.json({ status: 'completed', count: images.length });
  } catch (err) {
    // Refund on error
    await supabase.rpc('fail_project_and_refund', {
      p_project_id: project.id,
      p_reason: err instanceof Error ? err.message : 'Storage error',
    });
    return NextResponse.json({ status: 'failed_and_refunded' }, { status: 500 });
  }
}
