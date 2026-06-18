import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

  // Owner bypasses all checks
  if (!isOwnerByEmail(user.email)) {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!reviewer || !['مالك', 'إشراف إداري'].includes(reviewer.role)) {
      return errorResponse('صلاحيات غير كافية.', 403);
    }
  }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,status,created_at,last_login_at')
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) return errorResponse('إعدادات Supabase غير مكتملة.');

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return errorResponse('غير مصرح.', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) return errorResponse('جلسة غير صالحة.', 401);

  const body = await request.json();
  const { userId, newRole, newStatus } = body;

  // Check if owner by email (code-level override)
  const isOwner = isOwnerByEmail(user.email);

  if (!isOwner) {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!reviewer || !['مالك', 'إشراف إداري'].includes(reviewer.role)) {
      return errorResponse('صلاحيات غير كافية.', 403);
    }
  }

  const updateData: any = {};
  if (newRole) updateData.role = newRole;
  if (newStatus) updateData.status = newStatus;
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ success: true });
}