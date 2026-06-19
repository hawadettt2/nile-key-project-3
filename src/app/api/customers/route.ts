import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';
import type { UserRole } from '@/lib/supabase-types';

const CUSTOMER_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف'];

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, CUSTOMER_ROLES);

    const { data, error } = await supabase
      .from('customers')
      .select('id, user_id, name, email, phone, company_name, country, created_at, updated_at')
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
    requireRole(profile, CUSTOMER_ROLES);

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : null;
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : null;
    const company_name = typeof body?.company_name === 'string' ? body.company_name.trim() : null;
    const country = typeof body?.country === 'string' ? body.country.trim() : null;

    if (!name) throw new ApiError(400, 'اسم العميل مطلوب.');

    const { data, error } = await supabase
      .from('customers')
      .insert({ user_id: user.id, name, email, phone, company_name, country })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
