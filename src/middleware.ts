import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((auth, req) => {
  // Middleware processing
});

export const config = {
  matcher: [
    // Exclude files in /public folder
    '/((?!_next|[^?]*\.(?:css|js|png|jpg|jpeg|svg|gif|webp)$).*)',
    // Exclude /api/auth routes
    '/(api|trpc)(.*)',
  ],
};
