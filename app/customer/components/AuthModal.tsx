import React, { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { InputField } from "../../../components/ui/InputField";
import BrandLogo from "../../../components/BrandLogo";
import { MODAL_TYPES, ModalType } from "@/hooks/utils/useModalQuery";
import { syne } from "@/app/font";
import Modal from "@/components/ui/Modal";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { maskEmail } from "@/lib/maskEmail";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ForgotPasswordEmail } from "@/app/emails/ForgotPasswordEmail";
import ForgotPasswordButton from "@/components/ui/ForgotPasswordButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: ModalType;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
}) => {
  const [mode, setMode] = useState<ModalType>(initialMode);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const isLogin = mode === MODAL_TYPES.LOGIN;
  const isSignup = mode === MODAL_TYPES.SIGNUP;

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (isSignup && !formData.fullname.trim())
      newErrors.fullname = "Fullname is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (isSignup && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setIsSocialLoading(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/",
      },
      {
        onError: (ctx) => {
          console.error(ctx);
          toast.error(ctx.error.message || "Google sign in failed");
          setIsSocialLoading(false);
        },
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    if (isSignup) {
      await authClient.signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.fullname,
          callbackURL: "/",
        },
        {
          onSuccess: () => {
            setVerificationSent(true);
            setIsLoading(false);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Failed to create account");
            setIsLoading(false);
          },
        },
      );
    } else if (isLogin) {
      await authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
        },
        {
          onSuccess: () => {
            onClose();
            setIsLoading(false);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Invalid credentials");
            setIsLoading(false);
          },
        },
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (!isOpen) return null;

  if (verificationSent) {
    return (
      <Modal
        title="Email Verification"
        onClose={() => {
          onClose();
          setVerificationSent(false);
          setFormData({
            fullname: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        }}
        className={syne.className}
      >
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-green-50 ring-8 ring-green-50/50">
            <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-50" />
            <DynamicIcon
              name="MailCheck"
              size={88}
              className="text-green-500 relative z-10"
            />
          </div>
          <h2 className="text-lg font-semibold">
            Account Created Successfully 🎉
          </h2>
          <p className="text-sm text-gray-600">
            Check your inbox to verify your account.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div
        className={`${syne.className} fixed inset-0 z-50 flex items-center justify-center p-4`}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-[#1a1a1a] p-6 text-center space-y-3">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex justify-center">
              <BrandLogo />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isLogin ? "Welcome Back!" : "Start your story today!"}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <InputField
                  label="Full Name"
                  placeholder="Juan Dela Cruz"
                  leftIcon={<User size={18} />}
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  error={errors.fullname}
                />
              )}
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
              {isSignup && (
                <InputField
                  label="Phone Number"
                  leftIcon={<Phone size={18} />}
                  placeholder="+63 912 345 6789"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                />
              )}
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
                      setShowPassword((p) => ({ ...p, password: !p.password }))
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
              {isSignup && (
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
                        setShowPassword((p) => ({
                          ...p,
                          password: !p.password,
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
              )}
              {isLogin && <ForgotPasswordButton email={formData.email} />}
              <button
                type="submit"
                disabled={isLoading || isSocialLoading}
                className="w-full bg-brand-color-500 hover:bg-[#c13500] disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            {isLogin && (
              <div className="relative flex items-center py-2">
                <div className="grow border-t border-gray-200"></div>
                <span className="shrink mx-4 text-gray-400 text-xs uppercase tracking-wider">
                  or
                </span>
                <div className="grow border-t border-gray-200"></div>
              </div>
            )}

            {/* Google Login Button */}
            {isLogin && (
              <button
                type="button"
                disabled={isLoading || isSocialLoading}
                onClick={handleGoogleSignIn}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSocialLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}

            <div className="text-center pt-2">
              <p className="text-gray-500 text-sm">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  type="button"
                  onClick={() =>
                    setMode(isLogin ? MODAL_TYPES.SIGNUP : MODAL_TYPES.LOGIN)
                  }
                  className="text-brand-color-500 font-semibold hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
