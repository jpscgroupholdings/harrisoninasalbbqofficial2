import React, { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { InputField } from "../../../components/ui/InputField";
import BrandLogo from "../../../components/BrandLogo";
import {
  useCustomerLogin,
  useCustomerSignup,
} from "@/hooks/api/useCustomerAuth";
import { MODAL_TYPES, ModalType } from "@/hooks/utils/useModalQuery";
import { syne } from "@/app/font";
import Modal from "@/components/ui/Modal";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { maskEmail } from "@/lib/maskEmail";

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
  const createAccount = useCustomerSignup();
  const loginAccount = useCustomerLogin();

  const [mode, setMode] = useState<ModalType>(initialMode);
  const [verificationSent, setVerificationSent] = useState(false);

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

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (isSignup && !formData.fullname.trim()) {
      newErrors.fullname = "Fullname is required";
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isSignup) {
      createAccount.mutate(formData, {
        onSuccess: () => {
          setVerificationSent(true);
          setFormData({
            fullname: formData.email,
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        },
      });
    } else if (isLogin) {
      loginAccount.mutate(
        {
          email: formData.email,
          password: formData.password,
        },
        {
          onSuccess: () => {
            onClose();
            setFormData({
              fullname: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
            });
          },
        },
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const PasswordToggle = ({
    isVisible,
    onToggle,
  }: {
    isVisible: boolean;
    onToggle: () => void;
  }) => {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        {!isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    );
  };

  const togglePassword = (field: keyof typeof showPassword) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (verificationSent) {
    return (
      <Modal
        title="Email Verification"
        onClose={onClose}
        className={`${syne.className}`}
      >
        <div className="flex flex-col items-center text-center gap-4 py-4">
          {/* Animated Check Icon */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-green-50 ring-8 ring-green-50/50">
            <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-50" />
            <DynamicIcon
              name="MailCheck"
              size={88}
              className="text-green-500 relative z-10"
            />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold">
            Account Created Successfully 🎉
          </h2>

          {/* Message */}
          <p className="text-sm text-gray-600 max-w-xs">
            We’ve sent a verification link to{" "}
            <span className="font-medium text-brand-color-500">
              {maskEmail(formData.email)}
            </span>
            . Please check your inbox and verify your account to continue.
          </p>

          {/* Hint */}
          <p className="text-xs text-gray-400">
            Didn’t receive the email? <span className="text-black">Check your spam folder</span>.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`${syne.className} fixed inset-0 z-50 flex items-center justify-center p-4`}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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
            <div>
              <h2 className="text-xl font-bold text-white">
                {isLogin ? "Welcome Back!" : "Start your story today!"}
              </h2>
              <p className="text-gray-400 text-sm">
                {isLogin
                  ? "Sign in to continue ordering"
                  : "Create an account to start your story"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isSignup && (
              <InputField
                label="Full Name"
                leftIcon={<User size={18} />}
                placeholder="Juan Dela Cruz"
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                error={errors.fullname}
              />
            )}

            <InputField
              label="Email Address"
              leftIcon={<Mail size={18} />}
              placeholder="juan@gmail.com"
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
              id="password"
              label="Password"
              name="password"
              type={showPassword.password ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              error={errors.password}
              leftIcon={<Lock size={18} />}
              rightElement={
                <PasswordToggle
                  isVisible={showPassword.password}
                  onToggle={() => togglePassword("password")}
                />
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
                  <PasswordToggle
                    isVisible={showPassword.confirmPassword}
                    onToggle={() => togglePassword("confirmPassword")}
                  />
                }
              />
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-brand-color-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={createAccount.isPending}
              className="w-full bg-brand-color-500 hover:bg-[#c13500] disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {createAccount.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
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

      {/* Animation */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default AuthModal;
