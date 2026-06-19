import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';
import { canModifyRole, UserRoleSchema } from '@/lib/rbac-validation';
import type { UserRole } from '@/lib/supabase-types';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

type RoleRequestAction = {
  requestId: string;
  approve: boolean;
};

async function fetchPendingRequest(supabase: any, requestId: string) {
  const { data, error } = await supabase
    .from('role_change_requests')
    .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, updated_at')
    .eq('id', requestId)
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!data) {
    throw new ApiError(404, 'الطلب غير موجود.');
  }

  return data;
}

async function fetchProfile(supabase: any, profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, status')
    .eq('id', profileId)
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!data) {
    throw new ApiError(404, 'الملف الشخصي غير موجود.');
  }

  return data;
}

async function fetchReviewerProfile(supabase: any, reviewerId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', reviewerId)
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!data) {
    throw new ApiError(404, 'الملف الشخصي للمراجع غير موجود.');
  }

  return data;
}

function assertReviewerCanAct(actorRole: UserRole, targetRole: UserRole, actorId: string, targetProfileId: string) {
  if (actorId === targetProfileId) {
    throw new ApiError(403, 'لا يمكن للمستخدم مراجعة طلبه الشخصي.');
  }

  if (!canModifyRole(actorRole, targetRole)) {
    throw new ApiError(403, 'صلاحيات غير كافية لمراجعة هذا الدور.');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, ['مالك', 'إشراف إداري']);

    const { data: requests, error } = await supabase
      .from('role_change_requests')
      .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, updated_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    if (!requests?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const profileIds = requests.map((item) => item.profile_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
      .in('id', profileIds);

    if (profilesError) {
      throw new ApiError(500, profilesError.message);
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const data = requests.map((item) => ({
      ...item,
      profiles: profileMap.get(item.profile_id),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, ['مالك', 'إشراف إداري'], 'صلاحيات غير كافية للمراجعة.');

    const body = (await request.json()) as RoleRequestAction;
    if (typeof body.requestId !== 'string' || typeof body.approve !== 'boolean') {
      throw new ApiError(400, 'بيانات المراجعة غير صالحة.');
    }

    const existing = await fetchPendingRequest(supabase, body.requestId);
    if (existing.status !== 'pending') {
      throw new ApiError(409, 'الطلب ليس قيد المراجعة.');
    }

    const targetProfile = await fetchProfile(supabase, existing.profile_id);
    const requestedRole = UserRoleSchema.safeParse(existing.requested_role).data as UserRole;
    assertReviewerCanAct(profile.role as UserRole, targetProfile.role as UserRole, user.id, existing.profile_id);

    const now = new Date().toISOString();

    if (body.approve) {
      const { error: markOldError } = await supabase
        .from('user_roles')
        .update({ is_current: false })
        .eq('profile_id', existing.profile_id)
        .eq('is_current', true);

      if (markOldError) {
        throw new ApiError(500, markOldError.message);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: requestedRole, status: 'active', updated_at: now })
        .eq('id', existing.profile_id);

      if (profileError) {
        throw new ApiError(500, profileError.message);
      }

      const { error: roleHistoryError } = await supabase
        .from('user_roles')
        .insert({ profile_id: existing.profile_id, role: requestedRole, assigned_at: now, is_current: true });

      if (roleHistoryError) {
        throw new ApiError(500, roleHistoryError.message);
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('role_change_requests')
      .update({ status: body.approve ? 'approved' : 'rejected', reviewer_id: user.id, reviewed_at: now, updated_at: now })
      .eq('id', body.requestId)
      .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, updated_at')
      .single();

    if (updateError) {
      throw new ApiError(500, updateError.message);
    }

    const reviewer = await fetchReviewerProfile(supabase, user.id);
    const data = {
      ...updated,
      reviewer: reviewer,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
