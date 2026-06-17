import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const role = token?.role as string | undefined;

    // Admin Portal Protection
    if (path.startsWith('/panel') && !path.startsWith('/panel/login')) {
      if (!token || (role !== 'SUPERADMIN' && role !== 'ADMIN')) {
        return NextResponse.redirect(new URL('/panel/login', req.url));
      }
    }

    // Participant Portal Protection
    if (path.startsWith('/clients/test') && !path.startsWith('/clients/test/login')) {
      if (!token || role !== 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/clients/test/login', req.url));
      }
    }

    // Client Portal Protection (Note: must check after /clients/test)
    if (path.startsWith('/clients') && !path.startsWith('/clients/test') && !path.startsWith('/clients/login')) {
      if (!token || role !== 'CUSTOMER') {
        return NextResponse.redirect(new URL('/clients/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // Always return true here so the middleware function above can handle multiple dynamic redirects
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/panel/:path*', '/clients/:path*']
};
