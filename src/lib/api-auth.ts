import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import type { UserRole } from './supabase-types';

export type ActorProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole | null;
  status: 'active' | 'suspended' | 'rejected' | null;
  email_verified: boolean | null;
};

export type ApiActor = {
  supabase: any;
  user: {
    id: string;
    email: string | null;
  };
  profile: ActorProfile;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError(500, 'إعدادات Supabase غير مكتملة.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'غير مصرح.');
  }

  return authHeader.slice('Bearer '.length);
}

export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createAdminSupabaseClient();
  const token = getBearerToken(request);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new ApiError(401, 'جلسة غير صالحة.');
  }

  return { supabase, user: { id: user.id, email: user.email ?? null } };
}

export async function getActor(request: NextRequest): Promise<ApiActor> {
  const { supabase, user } = await getAuthenticatedUser(request);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, status, email_verified')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!profile) {
    throw new ApiError(404, 'الملف الشخصي غير موجود.');
  }

  return { supabase, user, profile };
}

export function requireActiveActor(profile: ActorProfile) {
  if (profile.status && ['suspended', 'rejected'].includes(profile.status)) {
    throw new ApiError(403, 'الحساب غير نشط.');
  }
}

export function isOwnerProfile(profile: ActorProfile) {
  return profile.role === 'مالك';
}

export function hasRole(profile: ActorProfile, roles: UserRole[]) {
  return profile.role ? roles.includes(profile.role) : false;
}

export function requireRole(profile: ActorProfile, roles: UserRole[], message = 'صلاحيات غير كافية.') {
  if (!hasRole(profile, roles)) {
    throw new ApiError(403, message);
  }
}

export function requireEmailVerified(profile: ActorProfile) {
  if (!profile.email_verified) {
    throw new ApiError(403, 'يجب التحقق من البريد الإلكتروني أولاً.');
  }
}

export function requireProfileOwnerOrRole(profile: ActorProfile, targetId: string, roles: UserRole[]) {
  if (profile.id === targetId) return;
  requireRole(profile, roles, 'صلاحيات غير كافية للتعديل على ملف آخر.');
}
