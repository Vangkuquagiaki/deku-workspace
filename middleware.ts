import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/uploadthing",
    "/api/socket/io",
    "/api/livekit/webhook",
    "/meet(.*)",
    "/meetings(.*)",
    "/base(.*)",
    "/api/org-units(.*)",
    "/api/posts(.*)",
    "/api/tasks(.*)",
    "/api/profile(.*)",
    "/api/hr(.*)",
    "/api/meetings(.*)",
    "/api/leave(.*)",
    "/api/approvals(.*)",
    "/api/employees(.*)",
    "/api/audit-logs(.*)",
  ],
  ignoredRoutes: [
    "/api/uploadthing",
    "/api/socket/io",
    "/api/livekit/webhook",
  ],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
