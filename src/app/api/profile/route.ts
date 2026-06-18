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

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, phone, country, role, status, email_verified, created_at, updated_at')
    .eq('id', user.id)
    .single();

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

  const body = await request.json();
  const { displayName, phone, country } = body;

  const updateData: any = {
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };

  // Phone validation - must be NULL or match E.164 format
  if (phone && phone.trim() !== '') {
    if (phone.match(/^\+[1-9]\d{1,14}$/)) {
      updateData.phone = phone;
    }
  } else {
    updateData.phone = null;
  }

  if (country !== undefined) updateData.country = country;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}