import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('skcti_session');
  const path = request.nextUrl.pathname;

  const isPublic = path === '/' || path === '/login';

  if (session && isPublic) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Define protected paths (student app + admin OS)
  const isProtected = path.startsWith('/home') || 
                      path.startsWith('/learn') || 
                      path.startsWith('/tests') || 
                      path.startsWith('/rank') || 
                      path.startsWith('/ai') || 
                      path.startsWith('/settings') ||
                      path.startsWith('/admin');

  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
