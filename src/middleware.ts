import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:css|js|png|jpg|jpeg|svg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
  ],
};
