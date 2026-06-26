"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { InputField } from "@/components/ui/FormComponents/InputField";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Password strength checker
  const getStrength = (pwd: string) => {
    if (pwd.length === 0) return { score: 0, label: "", color: "" };
    if (pwd.length < 6)
      return { score: 1, label: "Too short", color: "bg-red-500" };
    if (pwd.length < 8)
      return { score: 2, label: "Weak", color: "bg-orange-400" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);
    const extras = [hasUpper, hasNum, hasSymbol].filter(Boolean).length;
    if (extras === 3)
      return { score: 4, label: "Strong", color: "bg-green-500" };
    if (extras >= 1) return { score: 3, label: "Good", color: "bg-yellow-400" };
    return { score: 2, label: "Weak", color: "bg-orange-400" };
  };

  const strength = getStrength(password);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); // prevents page reload

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    setIsLoading(true);

    const { error } = await authClient.resetPassword({
      token,
      newPassword: password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Failed to reset password.");
    } else {
      toast.success("Password reset successful!");
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white shadow-xl shadow-gray-200/80 border border-gray-100 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-linear-to-r from-brand-color-400 via-brand-color-500 to-brand-color-600" />

          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-color-50 mb-3">
                <DynamicIcon
                  name="KeyRound"
                  className="text-brand-color-500 w-5 h-5"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Set new password
              </h1>
              <p className="text-sm text-gray-500">
                Choose something strong and memorable.
              </p>
            </div>

            {/* Form — onSubmit handles the action */}
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <InputField
                  label="New Password"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter new password"
                  leftIcon={<DynamicIcon name="Lock" className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="cursor-pointer text-gray-400 hover:text-brand-color-500 transition-colors"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      <DynamicIcon
                        name={showPass ? "EyeOff" : "Eye"}
                        className="w-4 h-4"
                      />
                    </button>
                  }
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs font-medium ${
                        strength.score <= 2
                          ? "text-orange-500"
                          : strength.score === 3
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Requirements hint */}
              <ul className="space-y-1">
                {[
                  {
                    check: password.length >= 8,
                    text: "At least 8 characters",
                  },
                  {
                    check: /[A-Z]/.test(password),
                    text: "One uppercase letter",
                  },
                  { check: /[0-9]/.test(password), text: "One number" },
                ].map(({ check, text }) => (
                  <li
                    key={text}
                    className="flex items-center gap-2 text-xs text-gray-500"
                  >
                    <DynamicIcon
                      name={check ? "CircleCheck" : "Circle"}
                      className={`w-3.5 h-3.5 transition-colors ${check ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span className={check ? "text-gray-700" : ""}>{text}</span>
                  </li>
                ))}
              </ul>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-color-500 hover:bg-brand-color-600 active:scale-[0.98] text-white font-medium py-2.5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <DynamicIcon
                      name="Loader2"
                      className="w-4 h-4 animate-spin"
                    />
                    Resetting…
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Remembered it?{" "}
          <a
            href="/?modal=login"
            className="text-brand-color-500 hover:underline font-medium"
          >
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
