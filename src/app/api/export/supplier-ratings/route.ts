import { NextRequest, NextResponse } from 'next/server';
import { ApiError, getActor, requireActiveActor } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

function buildStats(rows: any[]) {
  const overallRatings = rows.map((row) => Number(row.overall_rating || 0));
  const average = overallRatings.length ? overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length : 0;
  return {
    averageRating: Number(average ? average.toFixed(2) : 0),
    excellentCount: rows.filter((row) => Number(row.overall_rating || 0) >= 4.5).length,
    goodCount: rows.filter((row) => {
      const rating = Number(row.overall_rating || 0);
      return rating >= 3.5 && rating < 4.5;
    }).length,
    fairCount: rows.filter((row) => Number(row.overall_rating || 0) < 3.5).length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await getActor(request);
    requireActiveActor(profile);
    const supplierId = request.nextUrl.searchParams.get('supplierId');
    const minRating = request.nextUrl.searchParams.get('minRating');
    if (!supplierId) throw new ApiError(400, 'Missing supplierId parameter');

    let query = supabase.from('supplier_ratings').select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false });

    if (minRating) query = query.gte('overall_rating', Number(minRating));

    const { data, error } = await query;

    if (error) throw new ApiError(500, error.message);
    const rows = data || [];
    return NextResponse.json({ success: true, data: rows, stats: buildStats(rows) });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to fetch ratings'));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const supplier_id = typeof body?.supplier_id === 'string' ? body.supplier_id : '';
    const quality_score = typeof body?.quality_score === 'number' ? body.quality_score : null;
    const delivery_score = typeof body?.delivery_score === 'number' ? body.delivery_score : null;
    const communication_score = typeof body?.communication_score === 'number' ? body.communication_score : null;
    const reliability_score = typeof body?.reliability_score === 'number' ? body.reliability_score : null;

    if (!supplier_id || quality_score === null || delivery_score === null || communication_score === null || reliability_score === null) {
      throw new ApiError(400, 'Missing required fields');
    }

    const { data, error } = await supabase
      .from('supplier_ratings')
      .insert({
        supplier_id,
        rated_by: user.id,
        quality_score,
        delivery_score,
        communication_score,
        reliability_score,
        comments: typeof body?.comments === 'string' ? body.comments : null,
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Failed to create rating'));
  }
}
