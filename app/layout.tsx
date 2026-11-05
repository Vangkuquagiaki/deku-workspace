import "./globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ModalProvider } from "@/components/providers/modal-provider";
import { SocketProvider } from "@/components/providers/socket-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://deku-workspace.vercel.app"),
  title: {
    default: "Deku Workspace - Nền tảng Hợp tác, Họp trực tuyến & AI Doanh nghiệp",
    template: "%s | Deku Workspace",
  },
  description:
    "Hệ thống hợp tác làm việc, phòng họp trực tuyến WebRTC và quản trị điều hành doanh nghiệp bảo mật Deku Workspace tích hợp Trợ lý AI thế hệ mới.",
  keywords: [
    "Deku Workspace",
    "deku-workspace",
    "deku-workspace.vercel.app",
    "Deku",
    "Lark Base Doanh Nghiệp",
    "Quản trị nhân sự AI",
    "Phòng họp trực tuyến WebRTC",
    "Hợp tác doanh nghiệp",
    "AI Assistant",
    "Discord Clone Enterprise",
  ],
  authors: [{ name: "Deku Engineering Team", url: "https://deku-workspace.vercel.app" }],
  creator: "Deku Team",
  publisher: "Deku Workspace",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  themeColor: "#111214",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deku Workspace",
  },
  openGraph: {
    title: "Deku Workspace - Enterprise Collaboration & AI Platform",
    description:
      "Nền tảng hợp nhất giao tiếp real-time, phòng họp trực tuyến WebRTC, Lark Base quản trị công việc và Trợ lý AI thế hệ mới.",
    url: "https://deku-workspace.vercel.app",
    siteName: "Deku Workspace",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Deku Workspace Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Deku Workspace - Enterprise Collaboration & AI Platform",
    description:
      "Nền tảng hợp nhất giao tiếp real-time, phòng họp trực tuyến WebRTC, Lark Base quản trị công việc và Trợ lý AI.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cmlnaHQtcGhlYXNhbnQtOTYuY2xlcmsuYWNjb3VudHMuZGV2JA";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(openSans.className, "bg-white dark:bg-[#313338]")}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            storageKey="discord-clone-theme"
          >
            <SocketProvider>
              <QueryProvider>
                <PwaProvider>
                  <ModalProvider />
                  {children}
                </PwaProvider>
              </QueryProvider>
            </SocketProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
