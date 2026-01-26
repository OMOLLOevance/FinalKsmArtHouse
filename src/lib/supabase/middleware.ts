import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger'; // Import logger

export async function updateSession(request: NextRequest) {
  logger.info('Middleware: Entering updateSession');
  logger.info('Middleware: Incoming cookies:', request.cookies.getAll());

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Clean up stale auth cookies from other Supabase projects
  const currentProjectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0];
  const allCookies = request.cookies.getAll();
  
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token') && 
        !cookie.name.includes(currentProjectRef)) {
      supabaseResponse.cookies.delete(cookie.name);
      logger.info(`Middleware: Removed stale auth cookie: ${cookie.name}`);
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set the cookie on the outgoing response
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Remove the cookie from the outgoing response
          supabaseResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // and Server Actions to be able to read the latest session
  const { data: { user } } = await supabase.auth.getUser();
  logger.info('Middleware: User after session refresh:', user ? { id: user.id, email: user.email } : 'No user');

  logger.info('Middleware: Outgoing cookies after session refresh:', supabaseResponse.cookies.getAll());
  logger.info('Middleware: Exiting updateSession');
  return supabaseResponse;
}