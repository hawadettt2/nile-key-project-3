import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase/server';
import { cookies } from 'next/headers';

// In production, use WhatsApp Business API
// For now, we'll simulate sending OTP
// To integrate with WhatsApp Business API:
// 1. Sign up for Meta Business Account
// 2. Get access token from https://developers.facebook.com/
// 3. Use the send message endpoint: https://graph.facebook.com/v18.0/{Phone-Number-ID}/messages

async function sendWhatsAppOTP(phoneNumber: string, code: string): Promise<boolean> {
  try {
    // WhatsApp Business API integration
    // const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    // const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    // const message = `كود التحقق الخاص بك هو: ${code}\nيرجى عدم مشاركته مع أي شخص آخر.`;
    
    // const response = await fetch(
    //   `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       to: phoneNumber,
    //       type: 'text',
    //       text: { body: message },
    //     }),
    //   }
    // );
    
    // const data = await response.json();
    // return data.success || false;
    
    // For development/demo: log the code
    console.log(`[WhatsApp OTP] To ${phoneNumber}: Your verification code is ${code}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp OTP:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { phoneNumber, userId } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +201234567890)' },
        { status: 400 }
      );
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // Update user profile with OTP
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        whatsapp_number: phoneNumber,
        verification_code: otp,
        verification_code_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId || '');
    
    if (updateError) {
      // If userId not provided, try to find by phone
      if (!userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phoneNumber)
          .single();
        
        if (profile) {
          await supabase
            .from('profiles')
            .update({
              whatsapp_number: phoneNumber,
              verification_code: otp,
              verification_code_expires_at: expiresAt.toISOString(),
            })
            .eq('id', profile.id);
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to update profile with OTP' },
          { status: 500 }
        );
      }
    }
    
    // Send OTP via WhatsApp
    const sent = await sendWhatsAppOTP(phoneNumber, otp);
    
    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP via WhatsApp' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully via WhatsApp',
      // In development, include the code (remove in production!)
      ...(process.env.NODE_ENV === 'development' && { code: otp }),
    });
    
  } catch (error: any) {
    console.error('WhatsApp verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { phoneNumber, code, userId } = await request.json();
    
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }
    
    // Find profile by phone number or userId
    let query = supabase
      .from('profiles')
      .select('*');
    
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('phone', phoneNumber);
    }
    
    const { data: profile, error: fetchError } = await query.single();
    
    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    // Verify code
    if (profile.verification_code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Check if code is expired
    if (profile.verification_code_expires_at) {
      const expiresAt = new Date(profile.verification_code_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Verification code has expired' },
          { status: 400 }
        );
      }
    }
    
    // Update profile: mark as verified and activate account
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        whatsapp_verified: true,
        verification_code: null,
        verification_code_expires_at: null,
        status: profile.status === 'pending_verification' ? 'active' : profile.status,
      })
      .eq('id', profile.id);
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully via WhatsApp',
      profile: {
        id: profile.id,
        whatsapp_verified: true,
        status: 'active',
      },
    });
    
  } catch (error: any) {
    console.error('WhatsApp verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
