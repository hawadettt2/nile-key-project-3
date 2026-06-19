import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, isOwnerProfile, requireActiveActor } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

function optionalString(body: unknown, key: string) {
  const value = (body as Record<string, unknown>)?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const title_ar = optionalString(body, 'title_ar');
    const title_en = optionalString(body, 'title_en');
    const alert_type = optionalString(body, 'alert_type');
    const priority = optionalString(body, 'priority') || 'medium';

    if (!title_ar || !title_en || !alert_type) throw new ApiError(400, 'Missing required fields');

    const { data, error } = await supabase
      .from('export_alerts')
      .insert({
        user_id: user.id,
        alert_type,
        title_ar,
        title_en,
        description_ar: optionalString(body, 'description_ar'),
        description_en: optionalString(body, 'description_en'),
        priority,
        is_read: false,
        is_dismissed: false,
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to create alert'));
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const params = request.nextUrl.searchParams;
    const userId = params.get('userId') || user.id;
    const alertType = params.get('type');
    const isRead = params.get('isRead');

    if (!isOwnerProfile(profile) && userId !== user.id) {
      throw new ApiError(403, 'صلاحيات غير كافية.');
    }

    let query = supabase
      .from('export_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (alertType) query = query.eq('alert_type', alertType);
    if (isRead !== null && isRead !== undefined && isRead !== '') query = query.eq('is_read', isRead === 'true');

    const { data, error } = await query;

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data: data || [], total: data?.length || 0 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to fetch alerts'));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const alertId = typeof body?.alertId === 'string' ? body.alertId : '';
    const is_read = typeof body?.is_read === 'boolean' ? body.is_read : null;
    const is_dismissed = typeof body?.is_dismissed === 'boolean' ? body.is_dismissed : null;

    if (!alertId || (is_read === null && is_dismissed === null)) throw new ApiError(400, 'Missing alert update fields');

    const { data: alert, error: fetchError } = await supabase
      .from('export_alerts')
      .select('user_id')
      .eq('id', alertId)
      .single();

    if (fetchError) throw new ApiError(500, fetchError.message);
    if (!isOwnerProfile(profile) && alert.user_id !== user.id) throw new ApiError(403, 'صلاحيات غير كافية.');

    const updates: Record<string, unknown> = {};
    if (is_read !== null) updates.is_read = is_read;
    if (is_dismissed !== null) updates.is_dismissed = is_dismissed;
    if (is_read) updates.read_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('export_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to update alert'));
  }
}
