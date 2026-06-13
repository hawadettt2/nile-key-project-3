import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: 'Server config missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    // Force update to owner
    const { data, error } = await adminSupabase
      .from('profiles')
      .update({ role: 'owner', status: 'active', email_verified: true })
      .eq('email', 'hawadettt2@gmail.com')
      .select();

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Role updated to owner', 
      data 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}