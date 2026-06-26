"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { syne } from "@/app/font";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { InputField } from "@/components/ui/FormComponents/InputField";

export default function VerifiedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const emailFromParams = searchParams.get("email") ?? ""; // ← grab email from URL

  const isExpired = !!error;

  const [email, setEmail] = useState(emailFromParams); // ← pre-filled!
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sent" | "already_verified" | "not_found"
  >("idle");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isExpired) {
      const timer = setTimeout(() => router.push("/"), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpired, router]);

  const handleResend = async () => {
    if (!email) return toast.error("Please enter your email");
    setIsLoading(true);

    try {
      const data = await apiClient.post<{
        status?: "sent" | "already_verified" | "not_found";
        error?: string;
      }>("/customer/auth/resend-verification", { email });

      if (data.status) {
        setResendStatus(data.status);
      }
    } catch (error: unknown) {
      // If apiClient throws on 404 and exposes the body
      const body = (error as { details?: { status?: string } })?.details;
      if (body?.status === "not_found") {
        setResendStatus("not_found");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isExpired) {
    return (
      <div
        className={`${syne.className} min-h-screen flex items-center justify-center bg-gray-50`}
      >
        <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-5 max-w-sm w-full">
          {resendStatus === "sent" ? (
            <>
              <DynamicIcon
                name="MailCheck"
                size={48}
                className="text-green-500"
              />
              <h1 className="text-xl font-bold text-gray-900">Email Sent!</h1>
              <p className="text-gray-500 text-sm">
                Check your inbox for a new verification link.
              </p>
            </>
          ) : resendStatus === "already_verified" ? (
            <>
              <DynamicIcon
                name="MailCheck"
                size={48}
                className="text-green-500"
              />
              <h1 className="text-xl font-bold text-gray-900">
                Email Already Verified
              </h1>
              <p className="text-gray-500 text-sm">
                This email is already verified. You can sign in now.
              </p>
              <button
                onClick={() => router.push("/?modal=login")}
                className="w-full bg-brand-color-500 hover:bg-[#c13500] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Sign In
              </button>
            </>
          ) : resendStatus === "not_found" ? (
            <>
              <DynamicIcon name="MailX" size={48} className="text-red-500" />
              <h1 className="text-xl font-bold text-red-500">
                Account Not Found
              </h1>
              <p className="text-gray-500 text-sm">
                No account exists for this email. Please create an account
                first.
              </p>
              <button
                onClick={() => router.push("/?modal=signup")}
                className="w-full bg-brand-color-500 hover:bg-[#c13500] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              <DynamicIcon name="MailX" size={48} className="text-red-500" />
              <h1 className="text-xl font-bold text-red-500">
                Link Expired ❌
              </h1>
              <p className="text-gray-500 text-sm">
                Your verification link has expired. Request a new one below.
              </p>

              <InputField
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full bg-brand-color-500 hover:bg-[#c13500] disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {isLoading ? "Sending..." : "Resend Verification Email"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${syne.className} min-h-screen flex items-center justify-center bg-gray-50`}
    >
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-5 text-center max-w-sm w-full">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-green-50 ring-8 ring-green-50/50">
          <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-50" />
          <DynamicIcon
            name="MailCheck"
            size={48}
            className="text-green-500 relative z-10"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Email Verified! 🎉</h1>
        <p className="text-gray-500 text-sm">
          Your account has been verified. Redirecting you to the home page...
        </p>
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    </div>
  );
}
