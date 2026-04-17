"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ForgotPasswordButtonProps {
  email: string;
}

export default function ForgotPasswordButton({
  email,
}: ForgotPasswordButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email || email.trim() === "") {
      toast.error("Please enter your email address first.");
      return;
    }

    setIsLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password", // page where user sets new password
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Failed to send reset link.");
    } else {
      toast.success("If that email exists, a reset link has been sent!");
    }
  };

  return (
    <div className="flex justify-end">
      <button
        type="button"
        disabled={isLoading}
        onClick={handleReset}
        className="text-sm text-brand-color-500 hover:underline disabled:opacity-50"
      >
        {isLoading ? "Sending..." : "Forgot password?"}
      </button>
    </div>
  );
}
