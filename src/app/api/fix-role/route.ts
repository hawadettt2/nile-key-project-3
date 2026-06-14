import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Directly update owner emails - no auth needed for this admin endpoint
    const ownerEmails = ['hawadettt@gmail.com', 'hawadettt2@gmail.com'];
    
    const { data: profiles, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'owner', status: 'active', email_verified: true })
      .in('email', ownerEmails)
      .select('id, email, role');

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Owner roles updated', 
      updated: profiles 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}