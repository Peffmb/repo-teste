import { clerkClient, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/exercises', '/workouts', '/diet', '/weight', '/analytics'];
const authRoutes = ['/sign-in', '/sign-up'];

export default async function middleware(request: NextRequest) {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // Sync Clerk user to Prisma on every request if authenticated
  if (userId) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      
      // Store user info in headers for use in server components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-clerk-user-id', userId);
      requestHeaders.set('x-clerk-email', clerkUser.emailAddresses[0]?.emailAddress || '');
      requestHeaders.set('x-clerk-name', clerkUser.fullName || '');
      requestHeaders.set('x-clerk-image-url', clerkUser.imageUrl || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
    }
  }

  // Protect routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathname.startsWith(route)) && userId) {
    return NextResponse.redirect(new URL('/exercises', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
