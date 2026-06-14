import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const ownerEmails = ['hawadettt@gmail.com', 'hawadettt2@gmail.com'];

    // Update role in profiles table
    const { data: updatedProfiles, error: profileErr } = await supabase
      .from('profiles')
      .update({ role: 'owner', status: 'active', email_verified: true })
      .in('email', ownerEmails)
      .select('id, email, role');

    if (profileErr) throw profileErr;

    // Also update user_metadata.role in auth.users via admin API
    const updateMetaPromises = ownerEmails.map(email =>
      supabase.auth.admin.updateUserByEmail(email, {
        user_metadata: { role: 'owner' }
      })
    );
    const metaResults = await Promise.allSettled(updateMetaPromises);
    const metaErrors = metaResults.filter(r => r.status === 'rejected');
    if (metaErrors.length > 0) {
      // Log but don't fail - profiles update is what matters for middleware
      console.warn('Some metadata updates failed:', metaErrors);
    }

    return NextResponse.json({
      success: true,
      message: 'Owner roles updated in profiles and user_metadata',
      updatedProfiles,
      metaResults: metaResults.map(r => 
        r.status === 'fulfilled' ? { success: true } : { error: String((r as any).reason) }
      )
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}