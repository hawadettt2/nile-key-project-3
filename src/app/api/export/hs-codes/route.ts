import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

function optionalString(body: unknown, key: string) {
  const value = (body as Record<string, unknown>)?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabase.from('hs_codes').select('*').order('code', { ascending: true });
    if (code) query = query.eq('code', code);
    if (category) query = query.eq('category', category);
    if (search) query = query.or(`code.ilike.%${search}%,product_name_ar.ilike.%${search}%,product_name_en.ilike.%${search}%,product_description.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data: data || [], total: data?.length || 0 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to fetch HS codes'));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, ['مالك', 'إشراف إداري']);

    const body = await request.json();
    const code = optionalString(body, 'code');
    const product_description = optionalString(body, 'product_description');
    if (!code || !product_description) throw new ApiError(400, 'Missing required fields');

    const { data, error } = await supabase
      .from('hs_codes')
      .insert({
        code,
        product_name_ar: optionalString(body, 'product_name_ar'),
        product_name_en: optionalString(body, 'product_name_en'),
        product_description,
        category: optionalString(body, 'category'),
        is_agricultural: typeof body?.is_agricultural === 'boolean' ? body.is_agricultural : false,
        tariff_rate: typeof body?.tariff_rate === 'number' ? body.tariff_rate : null,
        restrictions: typeof body?.restrictions === 'object' && body.restrictions ? body.restrictions : {},
        metadata: typeof body?.metadata === 'object' && body.metadata ? body.metadata : {},
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to create HS code'));
  }
}
