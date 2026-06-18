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

const VALID_ROLES = ['مالك', 'إشراف إداري', 'موظف', 'مستورد', 'مورد', 'مصدر', 'مستخدم مسجل', 'زائر'] as const;
type UserRole = typeof VALID_ROLES[number];

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'إعدادات Supabase غير مكتملة.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }

  let body: { role?: unknown; reason?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'الطلب غير صالح.' }, { status: 400 });
  }

  if (typeof body.role !== 'string') {
    return NextResponse.json({ success: false, error: 'الدور مطلوب.' }, { status: 400 });
  }

  if (!VALID_ROLES.includes(body.role as UserRole)) {
    return NextResponse.json({ success: false, error: 'الدور غير صالح.' }, { status: 400 });
  }

  // Check for existing pending request
  const { count } = await supabase
    .from('role_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('status', 'pending');

  if (count && count > 0) {
    return NextResponse.json({ success: false, error: 'طلب قيد المراجعة موجود مسبقاً.' }, { status: 409 });
  }

  try {
    const { data, error } = await supabase
      .from('role_change_requests')
      .insert({
        profile_id: user.id,
        requested_role: body.role as UserRole,
        status: 'pending',
        reason: typeof body.reason === 'string' ? body.reason : null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'تعذر إرسال الطلب.' }, { status: 500 });
  }
}
