"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { InputField } from "@/components/ui/InputField";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleReset = async () => {
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
    <div className="flex items-center justify-center px-4 py-60">
      <form className="w-full max-w-md space-y-4 border border-brand-color-500 p-6 rounded-lg">
        <h1 className="text-xl font-semibold text-brand-color-500">
          Reset Password
        </h1>

        {/* <input
          type="password"
          placeholder="Enter new password"
          className="w-full border  px-3 py-2 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /> */}
        <InputField
          label="New Password"
          type={`${showPass ? "text" : "password"}`}
          placeholder="Enter New Password"
          leftIcon={<Lock size={14} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="cursor-pointer text-xs hover:text-brand-color-500"
            >
              {showPass ? <Eye /> : <EyeOff />}
            </button>
          }
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={isLoading}
          className="w-full bg-brand-color-500 text-white py-2 rounded-md disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
