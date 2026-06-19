import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, ApiError, getActor, requireActiveActor, requireEmailVerified } from '@/lib/api-auth';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

function generateVerificationCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 1000000).toString().padStart(6, '0');
}

async function hashVerificationCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Buffer.from(digest).toString('base64url');
}

async function isVerificationCodeMatch(storedCode: string | null, code: string): Promise<boolean> {
  if (!storedCode) return false;
  const hash = await hashVerificationCode(code);
  return storedCode === hash || storedCode === code;
}

function getExpiryTime(): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry.toISOString();
}

async function sendVerificationEmail(email: string, code: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendAudience = process.env.RESEND_AUDIENCE;
  const from = process.env.EMAIL_FROM || 'Nile-Key <no-reply@nile-key.local>';

  if (!resendApiKey || !resendAudience) {
    console.warn('[email-verify] SMTP/Resend not configured; code generated for local development only.');
    return {
      localDevelopmentCode: code,
      configured: false,
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [resendAudience],
      subject: 'رمز التحقق من البريد - Nile-Key',
      html: `<p>رمز التحقق الخاص بك هو: <strong>${code}</strong></p><p>يرجى إدخاله في التطبيق خلال 10 دقائق.</p>`,
    }),
  });

  if (!response.ok) {
    throw new ApiError(500, `فشل إرسال البريد الإلكتروني: ${response.status}`);
  }

  return { configured: true };
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getActor(request);
    requireActiveActor(profile);

    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : user.email;

    if (!email) throw new ApiError(400, 'Email is required');
    if (user.email && email.toLowerCase() !== user.email.toLowerCase()) throw new ApiError(403, 'لا يمكن طلب رمز التحقق لبريد آخر.');

    const verificationCode = generateVerificationCode();
    const hashedCode = await hashVerificationCode(verificationCode);
    const expiryTime = getExpiryTime();
    const emailResult = await sendVerificationEmail(email, verificationCode);

    const { data: existingProfile, error: fetchError } = await createAdminSupabaseClient()
      .from('profiles')
      .select('id, email_verified')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw new ApiError(500, fetchError.message);
    if (existingProfile?.email_verified) {
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }
    if (!existingProfile || existingProfile.id !== user.id) {
      throw new ApiError(404, 'User not found');
    }

    const { error: updateError } = await createAdminSupabaseClient()
      .from('profiles')
      .update({ verification_code: hashedCode, verification_code_expires_at: expiryTime })
      .eq('id', existingProfile.id);

    if (updateError) throw new ApiError(500, updateError.message);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      emailSent: emailResult.configured,
      ...(process.env.NODE_ENV === 'development' && !emailResult.configured ? { localDevelopmentCode: emailResult.localDevelopmentCode } : {}),
    });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Internal server error'));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, profile } = await getActor(request);
    requireActiveActor(profile);

    const adminSupabase = createAdminSupabaseClient();
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : user.email || '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!email || !code) throw new ApiError(400, 'Email and verification code are required');
    if (user.email && email.toLowerCase() !== user.email.toLowerCase()) throw new ApiError(403, 'لا يمكن التحقق من بريد آخر.');

    const { data: profileRow, error: fetchError } = await adminSupabase
      .from('profiles')
      .select('id, verification_code, verification_code_expires_at, email_verified, status')
      .eq('id', user.id)
      .single();

    if (fetchError) throw new ApiError(404, 'User not found');
    if (profileRow.status === 'rejected') throw new ApiError(403, 'الحساب مرفوض.');
    if (profileRow.email_verified) return NextResponse.json({ success: true, message: 'Email already verified' });
    if (!(await isVerificationCodeMatch(profileRow.verification_code, code))) throw new ApiError(400, 'Invalid verification code');
    if (profileRow.verification_code_expires_at && new Date(profileRow.verification_code_expires_at) < new Date()) {
      throw new ApiError(400, 'Verification code expired');
    }

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ email_verified: true, verification_code: null, verification_code_expires_at: null, status: profileRow.status ?? 'active' })
      .eq('id', profileRow.id);

    if (updateError) throw new ApiError(500, updateError.message);

    return NextResponse.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'Internal server error'));
  }
}
