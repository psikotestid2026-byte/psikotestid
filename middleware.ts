import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const role = token?.role as string | undefined;

    // 1. Root domain (/) session isolation auto-redirect
    if (path === '/') {
      if (token && role === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/clients', req.url));
      }
      if (token && (role === 'SUPERADMIN' || role === 'ADMIN')) {
        return NextResponse.redirect(new URL('/panel', req.url));
      }
    }

    // 2. Redirect authenticated users away from login pages
    if (path === '/clients/login' && token && role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/clients', req.url));
    }

    if (path === '/panel/login' && token && (role === 'SUPERADMIN' || role === 'ADMIN')) {
      return NextResponse.redirect(new URL('/panel', req.url));
    }

    // 3. Admin Portal Route Protection
    if (path.startsWith('/panel') && !path.startsWith('/panel/login')) {
      if (!token || (role !== 'SUPERADMIN' && role !== 'ADMIN')) {
        return NextResponse.redirect(new URL('/panel/login', req.url));
      }
    }

    // 4. Candidate Test Taking Route Protection
    if (path.startsWith('/clients/test') && !path.startsWith('/clients/test/login')) {
      if (!token || role !== 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/clients/test/login', req.url));
      }
    }

    // 5. Client Portal Route Protection (checked after /clients/test & /clients/login)
    if (path.startsWith('/clients') && !path.startsWith('/clients/test') && !path.startsWith('/clients/login')) {
      if (!token || (role !== 'CUSTOMER' && role !== 'SUPERADMIN' && role !== 'ADMIN')) {
        return NextResponse.redirect(new URL('/clients/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // Return true to allow middleware function to handle dynamic redirects
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/', '/panel/:path*', '/clients/:path*']
};
