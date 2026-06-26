import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { InputField } from "../../../components/ui/FormComponents/InputField";
import type { SignupFormValues } from "./types";

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
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
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
              {showPassword.password ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          }
        />

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
          disabled={isLoading || isDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-color-500 py-3 font-semibold text-white transition-colors hover:bg-[#c13500] disabled:bg-gray-400"
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
