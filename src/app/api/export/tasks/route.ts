import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';
import type { UserRole } from '@/lib/supabase-types';

const TASK_MANAGER_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف'];

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
    requireRole(profile, TASK_MANAGER_ROLES);

    const body = await request.json();
    const title = optionalString(body, 'title');
    const description = optionalString(body, 'description');
    const assigned_to = optionalString(body, 'assigned_to');
    const priority = optionalString(body, 'priority') || 'medium';
    const due_date = optionalString(body, 'due_date');

    if (!title || !assigned_to) throw new ApiError(400, 'Missing required fields');

    const { data, error } = await supabase
      .from('employee_tasks')
      .insert({ title, description, assigned_to, assigned_by: user.id, priority, status: 'pending', due_date })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to create task'));
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const params = request.nextUrl.searchParams;
    const userId = params.get('userId') || user.id;
    const status = params.get('status');

    if (!requireRoleSilently(profile, TASK_MANAGER_ROLES) && userId !== user.id) {
      throw new ApiError(403, 'صلاحيات غير كافية.');
    }

    let query = supabase
      .from('employee_tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true, nullsFirst: true });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data: data || [], total: data?.length || 0 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to fetch tasks'));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = typeof body?.status === 'string' ? body.status : '';

    if (!id || !status) throw new ApiError(400, 'Missing task id or status');

    const { data: task, error: fetchError } = await supabase
      .from('employee_tasks')
      .select('assigned_to, assigned_by')
      .eq('id', id)
      .single();

    if (fetchError) throw new ApiError(500, fetchError.message);

    const canManage = requireRoleSilently(profile, TASK_MANAGER_ROLES);
    if (!canManage && task.assigned_to !== user.id && task.assigned_by !== user.id) {
      throw new ApiError(403, 'صلاحيات غير كافية.');
    }

    const completed_at = status === 'completed' ? (typeof body?.completed_at === 'string' ? body.completed_at : new Date().toISOString()) : null;

    const { data, error } = await supabase
      .from('employee_tasks')
      .update({ status, completed_at })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to update task'));
  }
}

function requireRoleSilently(profile: { role: UserRole | null; email: string | null }, roles: UserRole[]) {
  return Boolean(profile.role && roles.includes(profile.role));
}
