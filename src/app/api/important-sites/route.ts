import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, isOwnerProfile, requireActiveActor } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    let query = supabase
      .from('important_sites')
      .select('id, user_id, title, url, description, category_id, is_verified, source_type, credibility_score, country, tags, created_at');

    if (!isOwnerProfile(profile)) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : null;

    if (!title || !url) throw new ApiError(400, 'العنوان والرابط مطلوبان.');

    const { data, error } = await supabase
      .from('important_sites')
      .insert({ user_id: user.id, title, url, description })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
