import { useState } from "react";
import PasswordRequirementHint, {
  isPasswordSecure,
} from "./PasswordRequirementHint";
import Modal from "./Modal";
import { DynamicIcon } from "./DynamicIcon";
import { InputField } from "./FormComponents";

type PasswordChangePromptModalProps = {
  onChangePassword: (newPw: string) => Promise<void>;
  onSkip: () => void;
  loading: boolean;
};

/**
 * Modal prompting exisiting users to change their password
 * to meet the new security requirements
 * User can either update their password of skip for now
 * @param param0
 */
export function PasswordChangePromptModal({
  onChangePassword,
  onSkip,
  loading = false,
}: PasswordChangePromptModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const passwordValid = isPasswordSecure(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setError("");
      await onChangePassword(newPassword);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to change password. Please try again";
      setError(message);
    }
  };

  return (
    <Modal title="Secure Your Account" onClose={onSkip}>
      <div className="space-x-4">
        {/** Info banner */}
        <div className="flex items-start gap-3 bg-brand-color-50 border border-brand-color-200 rounded-xl p-4">
          <DynamicIcon
            name="ShieldAlert"
            size={20}
            className="text-brand-color-500 mt-0.5 shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-brand-color-800">
              We&apos;ve strengthened our password requirements
            </p>
            <p className="text-xs text-brand-color-600 mt-1">
              Your current password may not meet our new security standards. We
              recommend updating it to keep your account safe.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/** New password */}
          <div>
            <InputField
              label="New password"
              name="newPassword"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a strong password"
              leftIcon={<DynamicIcon name="Lock" size={18} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-gray-400"
                >
                  {showNew ? (
                    <DynamicIcon name="EyeOff" size={18} />
                  ) : (
                    <DynamicIcon name="Eye" size={18} />
                  )}
                </button>
              }
            />
            <PasswordRequirementHint password={newPassword} />
          </div>

          {/* Confirm password */}
          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            leftIcon={<DynamicIcon name="Lock" size={18} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-gray-400"
              >
                {showConfirm ? (
                  <DynamicIcon name="EyeOff" size={18} />
                ) : (
                  <DynamicIcon name="Eye" size={18} />
                )}
              </button>
            }
            error={
              confirmPassword && !passwordsMatch
                ? "Passwords do not match"
                : undefined
            }
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-brand-color-500 hover:bg-[#c13500]"
                  : "bg-gray-400"
              }`}
            >
              {loading ? (
                <>
                  <DynamicIcon
                    name="Loader2"
                    size={14}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
