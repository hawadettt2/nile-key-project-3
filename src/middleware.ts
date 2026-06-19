import { updateSession } from './supabase/middleware';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};

export default updateSession;
