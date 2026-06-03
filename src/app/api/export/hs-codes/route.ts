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
    if (!supabase) return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });

    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabase.from('hs_codes').select('*').order('code', { ascending: true });
    if (code) query = query.eq('code', code);
    if (category) query = query.eq('category', category);
    if (search) query = query.or(`code.ilike.%${search}%,product_name_ar.ilike.%${search}%,product_name_en.ilike.%${search}%,product_description.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [], total: data?.length || 0 });
  } catch (error: any) {
    console.error('Get HS codes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch HS codes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });

    const body = await request.json();
    const { code, product_description } = body;
    if (!code || !product_description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('hs_codes')
      .insert({
        code,
        product_name_ar: body.product_name_ar || null,
        product_name_en: body.product_name_en || null,
        product_description,
        category: body.category || null,
        is_agricultural: body.is_agricultural ?? false,
        tariff_rate: body.tariff_rate ?? null,
        restrictions: body.restrictions || {},
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Create HS code error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create HS code' }, { status: 500 });
  }
}
