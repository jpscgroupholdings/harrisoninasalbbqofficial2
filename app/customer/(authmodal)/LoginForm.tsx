import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import ForgotPasswordButton from "@/components/ui/ForgotPasswordButton";
import { InputField } from "../../../components/ui/FormComponents/InputField";
import type { LoginFormValues } from "./types";
import { GMAIL_DOMAIN, isGmail } from "@/lib/isAllowedEmails";

type LoginFormProps = {
  isLoading: boolean;
  isSocialLoading: boolean;
  onSubmit: (values: LoginFormValues) => void;
  onGoogleSignIn: () => void;
  onSwitchToSignup: () => void;
};

export function LoginForm({
  isLoading,
  isSocialLoading,
  onSubmit,
  onGoogleSignIn,
  onSwitchToSignup,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email";
    } else if (!isGmail(formData.email)) {
      nextErrors.email = `Only @${GMAIL_DOMAIN} email addresses are accepted`;
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Email Address"
          placeholder="example@gmail.com"
          leftIcon={<Mail size={18} />}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
        />

        <InputField
          label="Password"
          placeholder="Enter your password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          leftIcon={<Lock size={18} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-gray-400"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          }
        />

        <ForgotPasswordButton email={formData.email} />

        <button
          type="submit"
          disabled={isLoading || isSocialLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-color-500 py-3 font-semibold text-white transition-colors hover:bg-[#c13500] disabled:bg-gray-400"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="grow border-t border-gray-200" />
        <span className="mx-4 shrink text-xs uppercase tracking-wider text-gray-400">
          or
        </span>
        <div className="grow border-t border-gray-200" />
      </div>

      <button
        type="button"
        disabled={isLoading || isSocialLoading}
        onClick={onGoogleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {isSocialLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-brand-color-500 hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
