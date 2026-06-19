import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor, requireRole } from '@/lib/api-auth';
import type { UserRole } from '@/lib/supabase-types';

const CREATE_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف', 'مصدر'];
const UPDATE_ROLES: UserRole[] = ['مالك', 'إشراف إداري', 'موظف'];

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

function optionalString(body: unknown, key: string) {
  const value = (body as Record<string, unknown>)?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalNumber(body: unknown, key: string) {
  const value = (body as Record<string, unknown>)?.[key];
  return typeof value === 'number' ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    const { searchParams } = request.nextUrl;
    const country = searchParams.get('country');
    const status = searchParams.get('status');
    const minConfidence = searchParams.get('minConfidence');
    const search = searchParams.get('search');

    let query = supabase.from('export_opportunities').select('*').order('created_at', { ascending: false });
    if (country) query = query.eq('target_country', country);
    if (status) query = query.eq('status', status);
    if (minConfidence) query = query.gte('confidence_score', Number(minConfidence));
    if (search) query = query.or(`product_name_ar.ilike.%${search}%,product_name_en.ilike.%${search}%,target_country.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, data: data || [], total: data?.length || 0 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to fetch opportunities'));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);
    requireRole(profile, CREATE_ROLES);

    const body = await request.json();
    const product_name_ar = optionalString(body, 'product_name_ar');
    const product_name_en = optionalString(body, 'product_name_en');
    const target_country = optionalString(body, 'target_country');
    if (!product_name_ar || !product_name_en || !target_country) throw new ApiError(400, 'Missing required fields');

    const insertPayload = {
      discovered_by: user.id,
      hs_code_id: optionalString(body, 'hs_code_id'),
      product_name_ar,
      product_name_en,
      target_country,
      target_market_region: optionalString(body, 'target_market_region'),
      market_size_usd: optionalNumber(body, 'market_size_usd'),
      current_gap_tons: optionalNumber(body, 'current_gap_tons'),
      demand_trend: optionalString(body, 'demand_trend'),
      estimated_price_per_ton: optionalNumber(body, 'estimated_price_per_ton'),
      competition_level: optionalString(body, 'competition_level'),
      entry_barriers: typeof body?.entry_barriers === 'object' && body.entry_barriers ? body.entry_barriers : {},
      regulatory_requirements: typeof body?.regulatory_requirements === 'object' && body.regulatory_requirements ? body.regulatory_requirements : {},
      logistics_notes: optionalString(body, 'logistics_notes'),
      status: optionalString(body, 'status') || 'discovered',
      confidence_score: optionalNumber(body, 'confidence_score'),
      ai_generated: typeof body?.ai_generated === 'boolean' ? body.ai_generated : false,
    };

    const { data, error } = await supabase.from('export_opportunities').insert(insertPayload).select().single();

    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to create opportunity'));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) throw new ApiError(400, 'Missing opportunity id');

    const { data: opportunity, error: fetchError } = await supabase
      .from('export_opportunities')
      .select('discovered_by')
      .eq('id', id)
      .single();

    if (fetchError) throw new ApiError(500, fetchError.message);

    const canUpdate = requireRoleSilently(profile, UPDATE_ROLES) || opportunity.discovered_by === user.id;
    if (!canUpdate) throw new ApiError(403, 'صلاحيات غير كافية.');

    const updates: Record<string, unknown> = {};
    [
      'status',
      'confidence_score',
      'logistics_notes',
      'target_country',
      'target_market_region',
      'market_size_usd',
      'current_gap_tons',
      'demand_trend',
      'estimated_price_per_ton',
      'competition_level',
    ].forEach((key) => {
      if (body[key] !== undefined) updates[key] = body[key];
    });
    if (body.entry_barriers !== undefined) updates.entry_barriers = body.entry_barriers;
    if (body.regulatory_requirements !== undefined) updates.regulatory_requirements = body.regulatory_requirements;
    if (body.ai_generated !== undefined) updates.ai_generated = body.ai_generated;

    const { data, error } = await supabase.from('export_opportunities').update(updates).eq('id', id).select().single();

    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to update opportunity'));
  }
}

function requireRoleSilently(profile: { role: UserRole | null; email: string | null }, roles: UserRole[]) {
  return Boolean(profile.role && roles.includes(profile.role));
}
