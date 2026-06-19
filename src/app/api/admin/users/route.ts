import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';
import { canModifyRole, canModifyStatus, UserStatusSchema, UserRoleSchema } from '@/lib/rbac-validation';
import type { UserRole } from '@/lib/supabase-types';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

async function fetchTargetProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', userId)
    .single();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'المستخدم غير موجود.');

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, ['مالك', 'إشراف إداري']);

    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,display_name,role,status,created_at,last_login_at')
      .order('created_at', { ascending: false });

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
    requireRole(profile, ['مالك', 'إشراف إداري']);

    const body = await request.json();
    const userId = typeof body?.userId === 'string' ? body.userId : '';

    if (!userId) throw new ApiError(400, 'userId مطلوب.');
    if (userId === user.id && profile.role !== 'مالك') {
      throw new ApiError(403, 'لا يمكن تعديل صلاحيات حسابك إلا بواسطة المالك.');
    }

    const targetProfile = await fetchTargetProfile(supabase, userId);
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body?.newRole !== undefined) {
      const parsedRole = UserRoleSchema.safeParse(body.newRole);
      if (!parsedRole.success) throw new ApiError(400, 'الدور غير صالح.');

      const newRole = parsedRole.data as UserRole;
      if (!canModifyRole(profile.role as UserRole, targetProfile.role as UserRole)) {
        throw new ApiError(403, 'صلاحيات غير كافية لتغيير هذا الدور.');
      }

      updateData.role = newRole;
    }

    if (body?.newStatus !== undefined) {
      const parsedStatus = UserStatusSchema.safeParse(body.newStatus);
      if (!parsedStatus.success) throw new ApiError(400, 'حالة المستخدم غير صالحة.');

      const newStatus = parsedStatus.data;
      if (!canModifyStatus(profile.role as UserRole, targetProfile.role as UserRole, newStatus)) {
        throw new ApiError(403, 'صلاحيات غير كافية لتغيير حالة هذا المستخدم.');
      }

      updateData.status = newStatus;
    }

    if (Object.keys(updateData).length === 1) {
      throw new ApiError(400, 'يجب تحديد newRole أو newStatus.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id,email,display_name,role,status,created_at,last_login_at')
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
