import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);

    const { data, error } = await supabase
      .from('trade_sources')
      .select('id, title, url, main_category, description, credibility_score, source_type, is_verified, country, tags, created_at')
      .order('credibility_score', { ascending: false });

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
