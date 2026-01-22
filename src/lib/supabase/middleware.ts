import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Customer session cookie name
const CUSTOMER_SESSION_COOKIE = 'customer_session'
// Admin session cookie name
const ADMIN_SESSION_COOKIE = 'admin_session'

// Paths that don't require authentication
const publicPaths = ['/', '/customer-login', '/admin-login']

// API paths that are public (no auth required)
const publicApiPaths = [
  '/api/seed-admin',
  '/api/auth/customer/login',
  '/api/auth/admin/login',
  '/api/send-email',
  '/api/send-confirmation-email',
  '/api/submissions',
]

function isPublicPath(pathname: string): boolean {
  // Check exact public paths
  if (publicPaths.includes(pathname)) return true

  // Check public API paths
  if (pathname.startsWith('/api/')) {
    return publicApiPaths.some(apiPath => pathname.startsWith(apiPath))
  }

  return false
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths immediately - no database calls
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const cookieStore = await cookies()

  // Check customer authentication for customer dashboard
  if (pathname.startsWith('/customer-dashboard')) {
    const session = cookieStore.get(CUSTOMER_SESSION_COOKIE)
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/customer-login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Check admin authentication for admin routes
  if (pathname.startsWith('/admin')) {
    const session = cookieStore.get(ADMIN_SESSION_COOKIE)
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Parse session to check if password change is required
    try {
      const sessionData = JSON.parse(atob(session.value))
      if (sessionData.mustChangePassword && !pathname.includes('change-password')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/change-password'
        return NextResponse.redirect(url)
      }
    } catch {
      // Invalid session, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // Default: allow
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
