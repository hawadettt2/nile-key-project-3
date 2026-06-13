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

    const { data: existing } = await adminSupabase
      .from('profiles')
      .select('id, role')
      .eq('email', 'hawadettt2@gmail.com')
      .single();

    if (!existing) {
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email: 'hawadettt2@gmail.com',
        password: '123456',
        email_confirm: true,
        user_metadata: { display_name: 'Owner', role: 'owner' },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, created: true, userId: data.user?.id });
    }

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ role: 'owner' })
      .eq('email', 'hawadettt2@gmail.com');

    return NextResponse.json({ 
      success: true, 
      message: existing ? 'Owner role ensured' : 'Created', 
      userId: existing?.id 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}