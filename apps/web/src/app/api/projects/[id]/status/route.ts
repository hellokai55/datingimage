import { createSupabaseClient } from '@/supabase-clients/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project, error } = await supabase
    .from('photo_projects')
    .select('status, photo_count, error_message, completed_at')
    .eq('id', params.id)
    .eq('user_id', user.user.id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}
