import {
  ADMIN_ROLE_HOME_PATH,
  adminCanAccessPath,
  type AdminPlatformRole,
} from '@meridian/shared';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'admin_token';
const ADMIN_ROLE_COOKIE = 'admin_role';
const PUBLIC_PATHS = ['/login', '/embed-preview'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const role = (request.cookies.get(ADMIN_ROLE_COOKIE)?.value ?? 'SUPER_ADMIN') as AdminPlatformRole;

  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && !isPublic && !adminCanAccessPath(role, pathname)) {
    const home = ADMIN_ROLE_HOME_PATH[role] ?? '/';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
