import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, ApiError } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const displayName = typeof body?.displayName === 'string' && body.displayName.trim().length > 0
      ? body.displayName.trim()
      : email.split('@')[0] || 'New User';

    if (!email || !password) throw new ApiError(400, 'Email and password are required');
    if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');

    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: 'مستخدم مسجل',
        company_name: 'مفتاح النيل',
      },
    });

    if (error) throw new ApiError(400, error.message || JSON.stringify(error));

    const { error: profileErr } = await adminSupabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      display_name: displayName,
      role: 'مستخدم مسجل',
      status: 'active',
      email_verified: false,
    }, { onConflict: 'id' });

    if (profileErr) throw new ApiError(500, profileErr.message);

    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Internal server error'));
  }
}
