import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/supabase-types';
import { isOwnerByEmail } from '@/lib/access-control';

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

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) return errorResponse('إعدادات Supabase غير مكتملة.');

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return errorResponse('غير مصرح.', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) return errorResponse('جلسة غير صالحة.', 401);

  // Check if owner by email (code-level override)
  if (isOwnerByEmail(user.email)) {
    // Owner detected by email - grant full access
  } else {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!reviewer || !['مالك', 'إشراف إداري'].includes(reviewer.role)) {
      return errorResponse('صلاحيات غير كافية.', 403);
    }
  }

  const { data, error } = await supabase
    .from('role_change_requests')
    .select(`
      id, 
      profile_id, 
      requested_role, 
      status, 
      reason, 
      reviewer_id, 
      reviewed_at, 
      created_at
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch profile data separately to avoid join issues
  if (data) {
    const profileIds = data.map(r => r.profile_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,email,role')
      .in('id', profileIds);
    
    data.forEach(req => {
      const profile = profiles?.find(p => p.id === req.profile_id);
      req.profiles = profile ? { email: profile.email, role: profile.role } : undefined;
    });
  }

  if (error) return errorResponse(error.message);

  return NextResponse.json({ success: true, data });
}

type RoleRequestAction = { requestId: string; approve: boolean };
type RoleRequestCreate = { role: string; reason?: string };

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) return errorResponse('إعدادات Supabase غير مكتملة.');

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('الطلب غير صالح.', 400);
  }

  // Check if this is a review action
  if (typeof (body as RoleRequestAction).requestId === 'string' && 
      typeof (body as RoleRequestAction).approve === 'boolean') {
    const action = body as RoleRequestAction;
    
    // Verify reviewer is admin/owner
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return errorResponse('غير مصرح.', 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) return errorResponse('جلسة غير صالحة.', 401);

    // Check if owner by email (code-level override) or by profile role
    const isOwner = isOwnerByEmail(user.email);
    
    if (!isOwner) {
      const { data: reviewer } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!reviewer || !['مالك', 'إشراف إداري'].includes(reviewer.role)) {
        return errorResponse('صلاحيات غير كافية للمراجعة.', 403);
      }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('role_change_requests')
      .select('id, profile_id, requested_role, status, profiles!inner(email, role)')
      .eq('id', action.requestId)
      .single();

    if (fetchError) return errorResponse(fetchError.message, 500);
    if (!existing) return errorResponse('الطلب غير موجود.', 404);
    if (existing.status !== 'pending') return errorResponse('الطلب ليس قيد المراجعة.', 409);

    if (action.approve) {
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
        .update({ role: newRole, status: 'active', updated_at: new Date().toISOString() })
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
        status: action.approve ? 'approved' : 'rejected',
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', action.requestId)
      .select('id, profile_id, requested_role, status, reason, reviewer_id, reviewed_at, created_at, profiles!inner(email, role)')
      .single();

    if (updateError) return errorResponse(updateError.message);

    return NextResponse.json({ success: true, data: updated });
  }

  // Create new role request
  const create = body as RoleRequestCreate;
  
  if (typeof create.role !== 'string') {
    return errorResponse('role مطلوب.', 400);
  }

  // Validate role
  const validRoles: UserRole[] = ['مالك', 'إشراف إداري', 'موظف', 'مستورد', 'مورد', 'مصدر', 'مستخدم مسجل', 'زائر'];
  if (!validRoles.includes(create.role as UserRole)) {
    return errorResponse('دور غير صالح.', 400);
  }

  // Get user from auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return errorResponse('غير مصرح.', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return errorResponse('جلسة غير صالحة.', 401);

  // Check if user email is verified
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email_verified')
    .eq('id', user.id)
    .single();

  if (!userProfile?.email_verified) {
    return errorResponse('يجب التحقق من البريد الإلكتروني أولاً.', 403);
  }

  // Check for existing pending request
  const { count } = await supabase
    .from('role_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('status', 'pending');

  if (count && count > 0) return errorResponse('طلب قيد المراجعة موجود مسبقاً.', 409);

  const { data, error } = await supabase
    .from('role_change_requests')
    .insert({
      profile_id: user.id,
      requested_role: create.role,
      status: 'pending',
      reason: typeof create.reason === 'string' ? create.reason : null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ success: true, data });
}
