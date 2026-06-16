import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase/server';
import { requestRoleChange } from '@/lib/role-service';
import { UserRoleSchema } from '@/lib/rbac-validation';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

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

  const roleResult = UserRoleSchema.safeParse(body.role);
  if (!roleResult.success) {
    return NextResponse.json({ success: false, error: 'الدور غير صالح.' }, { status: 400 });
  }

  try {
    await requestRoleChange(user.id, roleResult.data, typeof body.reason === 'string' ? body.reason : undefined);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'تعذر إرسال الطلب.' }, { status: 400 });
  }
}
