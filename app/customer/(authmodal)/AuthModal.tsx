import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import BrandLogo from "../../../components/BrandLogo";
import { MODAL_TYPES, type ModalType } from "@/hooks/utils/useModalQuery";
import { syne } from "@/app/font";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { maskEmail } from "@/helper/maskEmail";
import { mergeGuestCartOnLogin } from "@/contexts/CartContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { VerificationSent } from "./VerificationSent";
import { PasswordChangePromptModal } from "../../../components/ui/PasswordChangePromptModal";
import { apiClient } from "@/lib/apiClient";
import type { AuthMode, LoginFormValues, SignupFormValues } from "./types";

/** localStorage key to track if the user has already skipped the password prompt. */
const PASSWORD_PROMPT_SKIPPED_KEY = "password_prompt_skipped";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: ModalType;
}

function getAuthMode(mode: ModalType): AuthMode {
  return mode === MODAL_TYPES.SIGNUP ? MODAL_TYPES.SIGNUP : MODAL_TYPES.LOGIN;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(getAuthMode(initialMode));
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmailHint, setVerificationEmailHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // Password change prompt state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isLogin = mode === MODAL_TYPES.LOGIN;

  React.useEffect(() => {
    setMode(getAuthMode(initialMode));
  }, [initialMode]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (searchParams.get("signupVerification") === "sent") {
      setVerificationSent(true);
      setVerificationEmailHint(searchParams.get("emailHint") ?? "");
    }
  }, [isOpen, searchParams]);

  const updateModalMode = (nextMode: AuthMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", nextMode);

    setMode(nextMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const persistSignupVerificationState = (email: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", MODAL_TYPES.SIGNUP);
    params.set("signupVerification", "sent");
    params.set("emailHint", maskEmail(email));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const resetModal = () => {
    setVerificationSent(false);
    setVerificationEmailHint("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    params.delete("signupVerification");
    params.delete("emailHint");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleGoogleSignIn = async () => {
    setIsSocialLoading(true);
    let socialFailed = false;

    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/",
      },
      {
        onError: (ctx) => {
          socialFailed = true;
          toast.error(ctx.error.message || "Google sign in failed");
          setIsSocialLoading(false);
        },
      },
    );

    if (!socialFailed) {
      await mergeGuestCartOnLogin();
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);

    const normalizedEmail = values.email.trim().toLowerCase();
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;

    await authClient.signUp.email(
      {
        email: normalizedEmail,
        password: values.password,
        name: fullName,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        callbackURL: `/verified?email=${encodeURIComponent(normalizedEmail)}`,
      },
      {
        onSuccess: () => {
          setVerificationEmailHint(maskEmail(normalizedEmail));
          setVerificationSent(true);
          persistSignupVerificationState(normalizedEmail);
          setIsLoading(false);
        },
        onError: (ctx) => {
          const isExistingEmail = ctx.error.message
            ?.toLowerCase()
            .includes("already");
          const message = isExistingEmail
            ? "This email is already registered. Please sign in instead."
            : ctx.error.message || "Failed to create account.";

          toast.error(message);
          setIsLoading(false);
        },
      },
    );
  };

  /**
   * After successful email login, check if the user has a credential account
   * and whether they've already been prompted. If they haven't, show the
   * password change prompt. Skip for OAuth-only accounts.
   */
  const checkAndShowPasswordPrompt = useCallback(async () => {
    // Check localStorage - if they've already skipped, don't prompt again
    if (localStorage.getItem(PASSWORD_PROMPT_SKIPPED_KEY)) return;

    try {
      const { data: accounts } = await authClient.listAccounts();
      if (!accounts) return;

      // Only prompt for credential-based accounts (not OAuth-only)
      const hasCredential = accounts.some(
        (acc: { providerId: string }) => acc.providerId === "credential",
      );
      if (!hasCredential) return;

      setShowPasswordPrompt(true);
    } catch {
      // If account check fails, just proceed normally
    }
  }, []);

  const handlePasswordChange = async (newPassword: string) => {
    setIsChangingPassword(true);
    try {
      await apiClient.post("/auth/customer/change-password", { newPassword });
      toast.success("Password updated successfully!");
      setShowPasswordPrompt(false);
      localStorage.setItem(PASSWORD_PROMPT_SKIPPED_KEY, "true");
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordPromptSkip = () => {
    setShowPasswordPrompt(false);
    localStorage.setItem(PASSWORD_PROMPT_SKIPPED_KEY, "true");
  };

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    let signedIn = false;

    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          signedIn = true;
          onClose();
          setIsLoading(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Invalid credentials");
          setIsLoading(false);
        },
      },
    );

    if (signedIn) {
      await mergeGuestCartOnLogin();
      checkAndShowPasswordPrompt();
    }
  };

  if (!isOpen) return null;

  // Password change prompt overlay
  if (showPasswordPrompt) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={handlePasswordPromptSkip}
        />
        <PasswordChangePromptModal
          onChangePassword={handlePasswordChange}
          onSkip={handlePasswordPromptSkip}
          loading={isChangingPassword}
        />
      </>
    );
  }

  if (verificationSent) {
    return (
      <Modal
        title="Email Verification"
        onClose={resetModal}
        className={syne.className}
      >
        <VerificationSent emailHint={verificationEmailHint} />
      </Modal>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`${syne.className} fixed inset-0 z-50 flex items-center justify-center p-4`}
      >
        <div
          className="max-h-[90vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-2xl bg-white shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative space-y-3 bg-[#1a1a1a] p-6 text-center">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-gray-400 transition-colors hover:text-white"
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

          <div className="space-y-4 p-6">
            {isLogin ? (
              <LoginForm
                isLoading={isLoading}
                isSocialLoading={isSocialLoading}
                onSubmit={handleLogin}
                onGoogleSignIn={handleGoogleSignIn}
                onSwitchToSignup={() => updateModalMode(MODAL_TYPES.SIGNUP)}
              />
            ) : (
              <SignupForm
                isLoading={isLoading}
                isDisabled={isSocialLoading}
                onSubmit={handleSignup}
                onSwitchToLogin={() => updateModalMode(MODAL_TYPES.LOGIN)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
