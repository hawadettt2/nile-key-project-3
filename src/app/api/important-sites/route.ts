import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isOwnerByEmail } from '@/lib/access-control';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'إعدادات Supabase غير مكتملة.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ success: false, error: 'جلسة غير صاليحة.' }, { status: 401 });
  }

  // Owner bypasses all checks - see all sites
  if (isOwnerByEmail(user.email)) {
    const { data, error } = await supabase
      .from('important_sites')
      .select('id, title, url, description, category_id, is_verified, source_type, credibility_score, country, tags, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  }

  // Regular users see own sites
  const { data, error } = await supabase
    .from('important_sites')
    .select('id, title, url, description, category_id, is_verified, source_type, credibility_score, country, tags, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'إعدادات Supabase غير مكتملة.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ success: false, error: 'جلسة غير صاليحة.' }, { status: 401 });
  }

  const body = await request.json();
  const { title, url, description } = body;

  if (!title || !url) {
    return NextResponse.json({ success: false, error: 'العنوان والرابط مطلوبان.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('important_sites')
    .insert({
      user_id: user.id,
      title,
      url,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}