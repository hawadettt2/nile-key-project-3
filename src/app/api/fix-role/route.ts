import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // If user is owner email but not owner role, update it
    if (user.email && (user.email.includes('hawadettt@gmail.com')) && profile.role !== 'owner') {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'owner', status: 'active', email_verified: true })
        .eq('id', user.id)
        .select();

      return NextResponse.json({ 
        message: 'Role updated to owner', 
        oldRole: profile.role, 
        newProfile: updated 
      });
    }

    return NextResponse.json({ 
      profile, 
      message: profile.role === 'owner' ? 'Already owner' : 'Not owner email' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}