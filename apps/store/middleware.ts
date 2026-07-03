import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'store_token';

function parseStorePath(pathname: string): { slug: string; rest: string } | null {
  const match = pathname.match(/^\/s\/([^/]+)(\/.*)?$/);
  if (!match) return null;
  return { slug: match[1], rest: match[2] ?? '' };
}

function isPublicStorePath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login' || pathname === '/register') return true;

  const parsed = parseStorePath(pathname);
  if (!parsed) return false;

  const { rest } = parsed;
  if (rest === '' || rest === '/') return true;
  if (rest.startsWith('/login') || rest.startsWith('/register') || rest.startsWith('/bind')) {
    return true;
  }
  if (rest.startsWith('/products/')) return true;
  if (rest.startsWith('/cart') || rest.startsWith('/checkout')) return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isPublic = isPublicStorePath(pathname);

  if (!isPublic && !token) {
    const parsed = parseStorePath(pathname);
    if (parsed) {
      const loginUrl = new URL(`/s/${parsed.slug}/login`, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const parsed = parseStorePath(pathname);
  if (
    token &&
    parsed &&
    (parsed.rest === '/login' || parsed.rest === '/register')
  ) {
    return NextResponse.redirect(new URL(`/s/${parsed.slug}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
