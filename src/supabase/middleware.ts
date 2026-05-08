import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for middleware');
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, check role-based access
  if (user) {
    try {
      // Fetch user profile to get role and status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status, whatsapp_verified')
        .eq('id', user.id)
        .single();

      if (profile) {
        const pathname = request.nextUrl.pathname;

        // Check if user needs WhatsApp verification
        if (!profile.whatsapp_verified && pathname !== '/login' && !pathname.startsWith('/api/')) {
          // Redirect to login page for verification
          const redirectUrl = new URL('/login', request.url);
          return NextResponse.redirect(redirectUrl);
        }

        // Check if account is suspended or rejected
        if (profile.status === 'suspended' || profile.status === 'rejected') {
          const redirectUrl = new URL('/unauthorized', request.url);
          return NextResponse.redirect(redirectUrl);
        }

        // Role-based route protection
        // Admin routes - only owner and admin
        if (pathname.startsWith('/dashboard/admin')) {
          if (!['owner', 'admin'].includes(profile.role)) {
            const redirectUrl = new URL('/unauthorized', request.url);
            return NextResponse.redirect(redirectUrl);
          }
        }

        // Supplier routes - only supplier role
        if (pathname.startsWith('/suppliers')) {
          if (profile.role !== 'supplier') {
            const redirectUrl = new URL('/unauthorized', request.url);
            return NextResponse.redirect(redirectUrl);
          }
        }

        // Importer routes - importer and employee with permissions
        if (pathname.startsWith('/customers')) {
          if (!['importer', 'employee', 'owner', 'admin'].includes(profile.role)) {
            const redirectUrl = new URL('/unauthorized', request.url);
            return NextResponse.redirect(redirectUrl);
          }
        }

        // Employee routes - only employee role (with specific permissions checked in components)
        if (pathname.startsWith('/dashboard/employee')) {
          if (profile.role !== 'employee') {
            const redirectUrl = new URL('/unauthorized', request.url);
            return NextResponse.redirect(redirectUrl);
          }
        }

        // Agent routes - only agent role
        if (pathname.startsWith('/dashboard/agent')) {
          if (profile.role !== 'agent') {
            const redirectUrl = new URL('/unauthorized', request.url);
            return NextResponse.redirect(redirectUrl);
          }
        }
      }
    } catch (error) {
      console.error('Middleware profile check error:', error);
      // Continue without blocking - let the request proceed
    }
  }

  return response;
}
