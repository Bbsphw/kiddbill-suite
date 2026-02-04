// web/src/proxy.ts
// web/src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// กำหนด Route ที่เป็น Public (ใครก็เข้าได้ ไม่ต้อง Login)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // สำคัญ: ต้องเปิดให้ Clerk ยิง Webhook เข้ามาได้
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // ถ้าไม่ใช่ Public Route -> บังคับ Login
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
