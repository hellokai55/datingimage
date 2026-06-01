import { createSupabaseClient } from '@/supabase-clients/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const supabase = await createSupabaseClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename, contentType, projectId } = await request.json();

  if (!['image/jpeg', 'image/png'].includes(contentType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const path = `uploads/${user.user.id}/${projectId}/${uuidv4()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data?.signedUrl, path });
}
