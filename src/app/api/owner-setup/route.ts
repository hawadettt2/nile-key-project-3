import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: 'Server config missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    // Check if profile exists
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', 'hawadettt2@gmail.com')
      .single();

    if (profile) {
      // Update to owner if not already
      const { error: updateErr } = await adminSupabase
        .from('profiles')
        .update({ role: 'مالك', status: 'active', email_verified: true })
        .eq('email', 'hawadettt2@gmail.com');

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true,       message: 'تم تأكيد دور المالك', userId: profile.id });
    }

    // Profile doesn't exist - create via admin auth
    const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
      email: 'hawadettt2@gmail.com',
      password: '123456',
      email_confirm: true,
      user_metadata: { display_name: 'مالك', role: 'مالك' },
    });

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    const { error: profileErr } = await adminSupabase.from('profiles').insert({
      id: newUser.user?.id,
      email: 'hawadettt2@gmail.com',
      role: 'مالك',
      status: 'active',
      email_verified: true,
    });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true, userId: newUser.user?.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}