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
    return NextResponse.json({ success: false, error: 'جلسة غير صالحة.' }, { status: 401 });
  }

  // Owner bypasses all checks
  if (!isOwnerByEmail(user.email)) {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!reviewer || !['مالك', 'إشراف إداري', 'موظف'].includes(reviewer.role)) {
      return NextResponse.json({ success: false, error: 'صلاحيات غير كافية.' }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, company_name, country, created_at, updated_at')
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
    return NextResponse.json({ success: false, error: 'جلسة غير صالحة.' }, { status: 401 });
  }

  // Owner bypasses all checks
  if (!isOwnerByEmail(user.email)) {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!reviewer || !['مالك', 'إشراف إداري', 'موظف'].includes(reviewer.role)) {
      return NextResponse.json({ success: false, error: 'صلاحيات غير كافية.' }, { status: 403 });
    }
  }

  const body = await request.json();
  const { name, email, phone, company_name, country } = body;

  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: user.id,
      name,
      email,
      phone,
      company_name,
      country,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}