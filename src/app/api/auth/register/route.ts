
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const displayName = typeof body?.displayName === 'string' && body.displayName.trim().length > 0
      ? body.displayName.trim()
      : email.split('@')[0] || 'New User';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: 'importer',
        company_name: 'مفتاح النيل',
      },
    });

    if (error) {
      console.error('Admin createUser error:', error);
      return NextResponse.json(
        { error: error.message || JSON.stringify(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('Registration route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
