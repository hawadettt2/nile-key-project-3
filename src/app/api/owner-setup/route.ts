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

    // Check if auth user exists first
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === 'hawadettt2@gmail.com');

    let userId: string | undefined;

    if (!existingAuthUser) {
      // Create auth user
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: 'hawadettt2@gmail.com',
        password: '123456',
        email_confirm: true,
        user_metadata: { display_name: 'مالك', role: 'مالك' },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }
      userId = newUser.user?.id;
    } else {
      userId = existingAuthUser.id;
    }

    // Check if profile exists
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (profile) {
      // Update to owner
      const { error: updateErr } = await adminSupabase
        .from('profiles')
        .update({ role: 'مالك', status: 'active', email_verified: true })
        .eq('id', userId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'تم تأكيد دور المالك', userId });
    }

    // Create profile if doesn't exist (trigger may not have run)
    const { error: profileErr } = await adminSupabase.from('profiles').insert({
      id: userId,
      email: 'hawadettt2@gmail.com',
      role: 'مالك',
      status: 'active',
      email_verified: true,
    });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}