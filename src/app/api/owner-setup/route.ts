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
      return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
    }

    // Create owner profile directly if missing
    const { data: existing } = await adminSupabase
      .from('profiles')
      .select('id, email, role')
      .or('email.eq.hawadettt2@gmail.com,id.eq.hawadettt2@gmail.com')
      .single();

    if (!existing) {
      // Create via auth first
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: 'hawadettt2@gmail.com',
        password: '123456',
        email_confirm: true,
        user_metadata: { display_name: 'Owner', role: 'owner' },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }

      const { error: profileErr } = await adminSupabase.from('profiles').insert({
        id: newUser.user?.id,
        email: 'hawadettt2@gmail.com',
        role: 'owner',
        status: 'active',
        email_verified: true,
      });

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, created: true });
    }

    // Ensure owner role
    const { error: updateErr } = await adminSupabase
      .from('profiles')
      .update({ role: 'owner', status: 'active', email_verified: true })
      .eq('email', 'hawadettt2@gmail.com');

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Owner role ensured' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}