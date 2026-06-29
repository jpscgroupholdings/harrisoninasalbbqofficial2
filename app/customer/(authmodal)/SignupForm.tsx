import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { InputField } from "../../../components/ui/FormComponents/InputField";
import {
  PasswordRequirementHint,
  isPasswordSecure,
} from "../../../components/ui/PasswordRequirementHint";
import type { SignupFormValues } from "./types";
import { GMAIL_DOMAIN, isGmail } from "@/lib/isGmail";

type SignupFormProps = {
  isLoading: boolean;
  isDisabled: boolean;
  onSubmit: (values: SignupFormValues) => void;
  onSwitchToLogin: () => void;
};

export function SignupForm({
  isLoading,
  isDisabled,
  onSubmit,
  onSwitchToLogin,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [formData, setFormData] = useState<SignupFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track whether password meets the full policy — controls button state
  const passwordMeetsPolicy = isPasswordSecure(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email";
    } else if (!isGmail(formData.email)) {
      nextErrors.email = `Only @${GMAIL_DOMAIN} email addresses are accepted`;
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (!isPasswordSecure(formData.password)) {
      nextErrors.password = "Password does not meet the requirements";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
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

  // Button is disabled when loading, social loading, or password policy isn't met
  const isSubmitDisabled =
    isLoading || isDisabled || !passwordMeetsPolicy || !passwordsMatch;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="First Name"
            placeholder="Juan"
            leftIcon={<User size={18} />}
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            error={errors.firstName}
          />
          <InputField
            label="Last Name"
            placeholder="Dela Cruz"
            leftIcon={<User size={18} />}
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName}
          />
        </div>

        <InputField
          label="Email Address"
          placeholder="example@gmail.com"
          subLabel="Only Gmail addresses are accepted"
          leftIcon={<Mail size={18} />}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
        />

        <div>
          <InputField
            label="Password"
            placeholder="Enter your password"
            name="password"
            type={showPassword.password ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            leftIcon={<Lock size={18} />}
            rightElement={
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    password: !prev.password,
                  }))
                }
                className="text-gray-400"
              >
                {showPassword.password ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            }
          />
          <PasswordRequirementHint password={formData.password} />
        </div>

        <InputField
          id="confirm_password"
          label="Confirm Password"
          name="confirmPassword"
          type={showPassword.confirmPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
          leftIcon={<Lock size={18} />}
          rightElement={
            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  confirmPassword: !prev.confirmPassword,
                }))
              }
              className="text-gray-400"
            >
              {showPassword.confirmPassword ? (
                <Eye size={18} />
              ) : (
                <EyeOff size={18} />
              )}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-colors ${
            isSubmitDisabled
              ? "bg-gray-400"
              : "bg-brand-color-500 hover:bg-[#c13500]"
          }`}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="pt-2 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-brand-color-500 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
