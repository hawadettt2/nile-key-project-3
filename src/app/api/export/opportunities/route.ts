import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

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
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [], total: data?.length || 0 });
  } catch (error: any) {
    console.error('Get export opportunities error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const body = await request.json();
    const { product_name_ar, product_name_en, target_country } = body;
    if (!product_name_ar || !product_name_en || !target_country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertPayload = {
      discovered_by: body.discovered_by || null,
      hs_code_id: body.hs_code_id || null,
      product_name_ar,
      product_name_en,
      target_country,
      target_market_region: body.target_market_region || null,
      market_size_usd: body.market_size_usd ?? null,
      current_gap_tons: body.current_gap_tons ?? null,
      demand_trend: body.demand_trend || null,
      estimated_price_per_ton: body.estimated_price_per_ton ?? null,
      competition_level: body.competition_level || null,
      entry_barriers: body.entry_barriers || {},
      regulatory_requirements: body.regulatory_requirements || {},
      logistics_notes: body.logistics_notes || null,
      status: body.status || 'discovered',
      confidence_score: body.confidence_score ?? null,
      ai_generated: body.ai_generated ?? false,
    };

    const { data, error } = await supabase
      .from('export_opportunities')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Create export opportunity error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create opportunity' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: 'Missing opportunity id' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    ['status', 'confidence_score', 'logistics_notes', 'target_country', 'target_market_region', 'market_size_usd', 'current_gap_tons', 'demand_trend', 'estimated_price_per_ton', 'competition_level'].forEach((key) => {
      if (body[key] !== undefined) updates[key] = body[key];
    });
    if (body.entry_barriers !== undefined) updates.entry_barriers = body.entry_barriers;
    if (body.regulatory_requirements !== undefined) updates.regulatory_requirements = body.regulatory_requirements;
    if (body.ai_generated !== undefined) updates.ai_generated = body.ai_generated;

    const { data, error } = await supabase
      .from('export_opportunities')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update export opportunity error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update opportunity' }, { status: 500 });
  }
}
