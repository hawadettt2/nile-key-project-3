import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/supabase-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return errorResponse('إعدادات Supabase غير مكتملة.');

  const { data, error } = await supabase
    .from('role_change_requests')
    .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, profiles!inner(email, role)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message);

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) return errorResponse('إعدادات Supabase غير مكتملة.');

  let body: { requestId?: unknown; approve?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('الطلب غير صالح.', 400);
  }

  if (typeof body.requestId !== 'string' || typeof body.approve !== 'boolean') {
    return errorResponse('requestId و approve مطلوبان.', 400);
  }

  const { data: existing, error: fetchError } = await supabase
    .from('role_change_requests')
    .select('id, profile_id, requested_role, status, profiles!inner(email, role)')
    .eq('id', body.requestId)
    .single();

  if (fetchError) return errorResponse(fetchError.message, 500);
  if (!existing) return errorResponse('الطلب غير موجود.', 404);
  if (existing.status !== 'pending') return errorResponse('الطلب ليس قيد المراجعة.', 409);

  if (body.approve) {
    const newRole = existing.requested_role as UserRole;
    const profileId = existing.profile_id;

    const { error: markOldError } = await supabase
      .from('user_roles')
      .update({ is_current: false })
      .eq('profile_id', profileId)
      .eq('is_current', true);

    if (markOldError) return errorResponse(markOldError.message);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: newRole, status: 'active', email_verified: true, updated_at: new Date().toISOString() })
      .eq('id', profileId);

    if (profileError) return errorResponse(profileError.message);

    const { error: roleHistoryError } = await supabase
      .from('user_roles')
      .insert({
        profile_id: profileId,
        role: newRole,
        assigned_at: new Date().toISOString(),
        is_current: true,
      });

    if (roleHistoryError) return errorResponse(roleHistoryError.message);
  }

  const { data: updated, error: updateError } = await supabase
    .from('role_change_requests')
    .update({
      status: body.approve ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.requestId)
    .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, profiles!inner(email, role)')
    .single();

  if (updateError) return errorResponse(updateError.message);

  return NextResponse.json({ success: true, data: updated });
}
