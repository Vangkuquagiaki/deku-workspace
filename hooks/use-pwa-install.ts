"use client";

import { useState, useEffect } from "react";

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"windows" | "android" | "ios" | "mac" | "other">("windows");

  useEffect(() => {
    // Detect OS
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/android/.test(ua)) {
        setPlatform("android");
      } else if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform("ios");
      } else if (/macintosh|mac os x/.test(ua)) {
        setPlatform("mac");
      } else if (/win/.test(ua)) {
        setPlatform("windows");
      } else {
        setPlatform("other");
      }

      // Check if already in standalone display mode (installed)
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true);
      }
    }

    // Capture PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
    }
    setDeferredPrompt(null);
    return outcome === "accepted";
  };

  return {
    canInstall,
    isInstalled,
    platform,
    promptInstall,
  };
}
