"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false); // 👈 moved here

  useEffect(() => {
    // Check if already installed
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches); // 👈 safe here

    // Detect iOS
    const ios =
      /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
      !(window as any).MSStream;
    setIsIOS(ios);
    if (ios) setShowPrompt(true); // show iOS instructions banner

    // Android/Desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => setShowPrompt(false);

  if (isStandalone) return null; // 👈 safe now
  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 right-4 z-50 rounded-2xl bg-[#1e1b2e] shadow-2xl p-4 flex items-center gap-4 border border-white/10">
      <img
        src="/images/harrison_logo.png"
        alt="Harrison BBQ"
        className="w-12 h-12 rounded-xl object-cover"
      />

      <div className="flex-1">
        <p className="text-white font-semibold text-sm">Harrison Inasal & BBQ</p>
        {isIOS ? (
          <p className="text-white/60 text-xs mt-0.5">
            Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
          </p>
        ) : (
          <p className="text-white/60 text-xs mt-0.5">
            Install our app for a better experience!
          </p>
        )}
      </div>

      {!isIOS && (
        <button
          onClick={handleInstall}
          className="bg-[#ef4501] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition"
        >
          Install
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="text-white/40 hover:text-white/80 text-xl leading-none"
      >
        ✕
      </button>
    </div>
  );
}