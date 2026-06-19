import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';
import type { UserRole } from '@/lib/supabase-types';

const SUPPLIER_VIEW_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف', 'مستورد', 'مصدر'];
const SUPPLIER_CREATE_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف'];

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, SUPPLIER_VIEW_ROLES);

    const { data, error } = await supabase
      .from('suppliers')
      .select('id, user_id, name, contact_person, email, phone, address, governorate, is_nfsa_whitelisted, created_at, updated_at')
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
    requireRole(profile, SUPPLIER_CREATE_ROLES);

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const contact_person = typeof body?.contact_person === 'string' ? body.contact_person.trim() : null;
    const email = typeof body?.email === 'string' ? body.email.trim() : null;
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : null;
    const address = typeof body?.address === 'string' ? body.address.trim() : null;
    const governorate = typeof body?.governorate === 'string' ? body.governorate.trim() : null;
    const is_nfsa_whitelisted = typeof body?.is_nfsa_whitelisted === 'boolean' ? body.is_nfsa_whitelisted : false;

    if (!name) throw new ApiError(400, 'اسم المورد مطلوب.');

    const { data, error } = await supabase
      .from('suppliers')
      .insert({ user_id: user.id, name, contact_person, email, phone, address, governorate, is_nfsa_whitelisted })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
