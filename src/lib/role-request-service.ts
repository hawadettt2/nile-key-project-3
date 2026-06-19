import type { NextRequest } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireEmailVerified } from '@/lib/api-auth';
import { UserRoleSchema } from '@/lib/rbac-validation';
import type { UserRole } from '@/lib/supabase-types';

type RoleRequestCreate = {
  role: string;
  reason?: string;
};

export async function createRoleRequest(request: NextRequest) {
  const { supabase, user, profile } = await getActor(request);
  requireActiveActor(profile);
  requireEmailVerified(profile);

  const body = (await request.json()) as RoleRequestCreate;
  const parsedRole = UserRoleSchema.safeParse(body.role);

  if (!parsedRole.success) {
    throw new ApiError(400, 'الدور غير صالح.');
  }

  const requestedRole = parsedRole.data as UserRole;
  if (requestedRole === profile.role) {
    throw new ApiError(409, 'هذا الدور مُعيّن لك بالفعل.');
  }

  const { count } = await supabase
    .from('role_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('status', 'pending');

  if (count && count > 0) {
    throw new ApiError(409, 'طلب تغيير دور قيد المراجعة موجود مسبقاً.');
  }

  const { data, error } = await supabase
    .from('role_change_requests')
    .insert({
      profile_id: user.id,
      requested_role: requestedRole,
      status: 'pending',
      reason: typeof body.reason === 'string' ? body.reason.trim() : null,
    })
    .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, updated_at')
    .single();

  if (error) {
    throw new ApiError(500, error.message);
  }

  return data;
}
