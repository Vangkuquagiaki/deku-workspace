import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cmlnaHQtcGhlYXNhbnQtOTYuY2xlcmsuYWNjb3VudHMuZGV2JA";

const clerkSecretKey =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_Ue2NpWazl2gxZDQ9upvNMnmERgR8b2AjBcZVimI5Yz";

let clerkAuth: any = null;

try {
  clerkAuth = authMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey,
    publicRoutes: [
      "/",
      "/servers(.*)",
      "/channels(.*)",
      "/sign-in(.*)",
      "/sign-up(.*)",
      "/api/uploadthing",
      "/api/socket/io",
      "/api/livekit(.*)",
      "/meet(.*)",
      "/meetings(.*)",
      "/base(.*)",
      "/download(.*)",
      "/mobile(.*)",
      "/test-bot(.*)",
      "/api/download(.*)",
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
      "/api/text/translate(.*)",
      "/api/translation(.*)",
      "/api/ai-admin(.*)",
      "/api/personal(.*)",
      "/api/announcements(.*)",
      "/api/invitations(.*)",
      "/api/threads(.*)",
      "/api/glossary(.*)",
    ],
    ignoredRoutes: [
      "/api/uploadthing",
      "/api/socket/io",
      "/api/livekit(.*)",
      "/api/text/translate(.*)",
      "/api/translation(.*)",
      "/api/ai-admin(.*)",
      "/api/personal(.*)",
      "/api/announcements(.*)",
      "/api/invitations(.*)",
      "/api/threads(.*)",
      "/api/glossary(.*)",
      "/api/download(.*)",
      "/download(.*)",
      "/mobile(.*)",
      "/test-bot(.*)",
    ],
  });
} catch (err) {
  console.error("[MIDDLEWARE_INIT_ERROR]", err);
}

export default async function middleware(req: any, evt: any) {
  if (!clerkAuth) {
    return NextResponse.next();
  }

  try {
    const res = await clerkAuth(req, evt);
    return res || NextResponse.next();
  } catch (error) {
    console.error("[MIDDLEWARE_RUNTIME_ERROR]", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
