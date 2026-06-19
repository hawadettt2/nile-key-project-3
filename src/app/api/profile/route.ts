import { NextRequest, NextResponse } from 'next/server';
import { ApiError, createAdminSupabaseClient, getActor, requireActiveActor, requireProfileOwnerOrRole } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getActor(request);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, phone, country, role, status, email_verified, created_at, updated_at')
      .eq('id', user.id)
      .single();

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
    const targetUserId = typeof body?.userId === 'string' ? body.userId : user.id;
    requireProfileOwnerOrRole(profile, targetUserId, ['مالك', 'إشراف إداري']);

    const { displayName, phone, country } = body;

    const updateData: Record<string, unknown> = {
      display_name: typeof displayName === 'string' ? displayName : null,
      updated_at: new Date().toISOString(),
    };

    if (phone && phone.trim() !== '') {
      if (!/^\+[1-9]\d{1,14}$/.test(phone.trim())) {
        throw new ApiError(400, 'رقم الهاتف يجب أن يكون بصيغة E.164 مثل +20xxxxxxxxx أو فارغًا.');
      }
      updateData.phone = phone.trim();
    } else {
      updateData.phone = null;
    }

    if (country !== undefined) updateData.country = typeof country === 'string' ? country : null;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
