import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function buildStats(rows: any[]) {
  const overallRatings = rows.map((row) => Number(row.overall_rating || 0));
  const average = overallRatings.length
    ? overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length
    : 0;
  const excellentCount = rows.filter((row) => Number(row.overall_rating || 0) >= 4.5).length;
  const goodCount = rows.filter((row) => {
    const rating = Number(row.overall_rating || 0);
    return rating >= 3.5 && rating < 4.5;
  }).length;
  const fairCount = rows.filter((row) => Number(row.overall_rating || 0) < 3.5).length;
  return {
    averageRating: Number(average ? average.toFixed(2) : 0),
    excellentCount,
    goodCount,
    fairCount,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });

    const supplierId = request.nextUrl.searchParams.get('supplierId');
    const minRating = request.nextUrl.searchParams.get('minRating');
    if (!supplierId) return NextResponse.json({ error: 'Missing supplierId parameter' }, { status: 400 });

    let query = supabase
      .from('supplier_ratings')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (minRating) {
      query = query.gte('overall_rating', Number(minRating));
    }

    const { data, error } = await query;

    if (error) throw error;
    const rows = data || [];
    return NextResponse.json({ success: true, data: rows, stats: buildStats(rows) });
  } catch (error: any) {
    console.error('Get supplier ratings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ratings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getClient();
    if (!supabase) return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });

    const body = await request.json();
    const { supplier_id, quality_score, delivery_score, communication_score, reliability_score } = body;
    if (!supplier_id || !quality_score || !delivery_score || !communication_score || !reliability_score) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('supplier_ratings')
      .insert({
        supplier_id,
        rated_by: body.rated_by || null,
        quality_score,
        delivery_score,
        communication_score,
        reliability_score,
        comments: body.comments || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Create supplier rating error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create rating' }, { status: 500 });
  }
}
