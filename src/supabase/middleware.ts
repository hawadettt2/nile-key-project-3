
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isOpenRoute, isPublicApiRoute, isRoleAllowedForPath, normalizeRole } from '@/lib/access-control';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isOpenRoute(pathname) || isPublicApiRoute(pathname) || pathname.startsWith('/_next/')) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  let role = normalizeRole(user.user_metadata?.role);

try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, email_verified')
      .eq('id', user.id)
      .maybeSingle();

    role = normalizeRole(profile?.role) ?? role;

    if (profile?.status && ['suspended', 'rejected'].includes(profile.status)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (!profile?.email_verified && pathname !== '/login') {
      // Redirect to login with verify parameter - /login is open so no loop
      return NextResponse.redirect(new URL('/login?verify=true', request.url));
    }
  } catch (error) {
    console.error('Middleware profile fetch error:', error);
  }

  if (!isRoleAllowedForPath(role, pathname)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return response;
}
