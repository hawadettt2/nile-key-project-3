import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor } from '@/lib/api-auth';
import type { UserRole } from '@/lib/supabase-types';

const SHIPMENT_ADMIN_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف'];

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

function getOptionalString(body: unknown, key: string) {
  const value = (body as Record<string, unknown>)?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getOptionalNumber(body: unknown, key: string) {
  const value = (body as Record<string, unknown>)?.[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    let query = supabase.from('shipments').select('*');

    if (!requireRoleSilently(profile, SHIPMENT_ADMIN_ROLES)) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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

    const body = await request.json();
    const shipment_type = getOptionalString(body, 'shipment_type');
    const container_number = getOptionalString(body, 'container_number');
    const tracking_number = getOptionalString(body, 'tracking_number');
    const acid_number = getOptionalString(body, 'acid_number');
    const carrier_details = getOptionalString(body, 'carrier_details');
    const customer_id = getOptionalString(body, 'customer_id');
    const status = getOptionalString(body, 'status') || 'processing';
    const transport_type = getOptionalString(body, 'transport_type');
    const weight_kg = getOptionalNumber(body, 'weight_kg');
    const quantity = getOptionalNumber(body, 'quantity');
    const price = getOptionalNumber(body, 'price');
    const is_temperature_controlled = typeof body?.is_temperature_controlled === 'boolean' ? body.is_temperature_controlled : false;

    if (!shipment_type) throw new ApiError(400, 'نوع الشحنة مطلوب.');
    if (!tracking_number) throw new ApiError(400, 'رقم التتبع مطلوب.');
    if (!customer_id) throw new ApiError(400, 'العميل مطلوب.');
    if (price === null || price <= 0) throw new ApiError(400, 'السعر يجب أن يكون أكبر من صفر.');

    const { data, error } = await supabase
      .from('shipments')
      .insert({
        user_id: user.id,
        customer_id,
        shipment_type,
        weight_kg,
        quantity,
        price,
        container_number,
        tracking_number,
        acid_number,
        carrier_details,
        transport_type,
        status,
        is_temperature_controlled,
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}

function requireRoleSilently(profile: { role: UserRole | null; email: string | null }, roles: UserRole[]) {
  return Boolean(profile.role && roles.includes(profile.role));
}
