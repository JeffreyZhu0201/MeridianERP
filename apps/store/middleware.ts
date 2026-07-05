import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'store_token';

function isPublicStorePath(pathname: string): boolean {
  if (pathname === '/shop/account') {
    return false;
  }

  return (
    pathname === '/' ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/open-shop' ||
    pathname.startsWith('/open-shop/')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isPublic = isPublicStorePath(pathname);

  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && (pathname === '/login' || pathname === '/register')) {
    const from = request.nextUrl.searchParams.get('from');
    if (from?.startsWith('/open-shop')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/shop', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
