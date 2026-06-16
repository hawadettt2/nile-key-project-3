import { createServerSupabaseClient } from '@/supabase/server';
import type { UserRole } from '@/lib/supabase-types';

export async function getCurrentRole(userId: string): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.role ?? null;
}

export async function requestRoleChange(
  userId: string,
  newRole: UserRole,
  reason?: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from('role_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .eq('status', 'pending');

  if (count && count > 0) throw new Error('هناك طلب تغيير دور قيد المراجعة');

  const { data: existingRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('profile_id', userId);

  const alreadyHas = existingRoles?.some(r => r.role === newRole);
  if (alreadyHas) throw new Error('لا يمكن اختيار الدور ذاته مرة أخرى');

  const { error } = await supabase.from('role_change_requests').insert({
    profile_id: userId,
    requested_role: newRole,
    status: 'pending',
    reason,
  });

  if (error) throw error;
}

export async function reviewRoleRequest(
  requestId: string,
  reviewerId: string,
  approve: boolean,
  adminNote?: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { data: req, error: err1 } = await supabase
    .from('role_change_requests')
    .select('*, profiles!inner(email, role)')
    .eq('id', requestId)
    .single();

  if (err1) throw err1;
  if (req.status !== 'pending') throw new Error('الطلب ليس قيد المراجعة');

  const { data: reviewer } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', reviewerId)
    .single();

  if (!['مالك', 'إشراف إداري'].includes(reviewer?.role)) {
    throw new Error('غير مصرح لك بالمراجعة');
  }

  const { error: err2 } = await supabase
    .from('role_change_requests')
    .update({
      status: approve ? 'approved' : 'rejected',
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      reason: adminNote,
    })
    .eq('id', requestId);

  if (err2) throw err2;

  if (approve) {
    await supabase.from('user_roles').insert({
      profile_id: req.profile_id,
      role: req.profiles.role,
      assigned_at: new Date().toISOString(),
      is_current: false,
    });

    await supabase
      .from('profiles')
      .update({ role: req.requested_role })
      .eq('id', req.profile_id);

    await supabase.from('user_roles').insert({
      profile_id: req.profile_id,
      role: req.requested_role,
      assigned_at: new Date().toISOString(),
      is_current: true,
    });
  }
}

export async function canUserChooseRole(userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('role_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .eq('status', 'pending');

  return !(count && count > 0);
}