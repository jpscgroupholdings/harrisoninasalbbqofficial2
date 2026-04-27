"use client";

import { DynamicIcon } from "@/lib/DynamicIcon";
import { SectionCard } from "../component/SectionCard";
import { InputField } from "@/components/ui/InputField";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
// ─── Tab: Security ────────────────────────────────────────────────────────────

interface PasswordInputProps {
  label: string;
  name: keyof PasswordForm;
  showKey: keyof typeof initialShow;
  placeholder?: string;
  value: string;
  show: boolean;
  onToggleShow: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const initialShow = { current: false, new: false, confirm: false };

const PasswordInput = ({
  label,
  name,
  value,
  show,
  onToggleShow,
  onChange,
  placeholder,
  disabled,
}: PasswordInputProps) => (
  <InputField
    label={label}
    type={show ? "text" : "password"}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder ?? "••••••••"}
    disabled={disabled}
    leftIcon={<DynamicIcon name="Lock" />}
    rightElement={
      <button type="button" onClick={onToggleShow}>
        <DynamicIcon name={show ? "EyeOff" : "Eye"} size={15} />
      </button>
    }
  />
);

const SecurityTab = () => {
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState(initialShow);
  const [saving, setSaving] = useState(false);

  const [isOAuthOnly, setIsOAuthOnly] = useState(false);

  useEffect(() => {
    authClient.listAccounts().then(({ data }) => {
      if (data) {
        setIsOAuthOnly(!data.some((acc) => acc.providerId === "credential"));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { label: "Weak", color: "bg-red-400" },
      { label: "Fair", color: "bg-amber-400" },
      { label: "Good", color: "bg-yellow-400" },
      { label: "Strong", color: "bg-green-400" },
      { label: "Very strong", color: "bg-emerald-500" },
    ];
    return { score, ...levels[score] };
  };

  const strength = passwordStrength(form.newPassword);

  const handleSave = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(error.message || "Failed to update password");
        return;
      }

      toast.success("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Change Password"
        subtitle="Keep your account secure"
        icon="Lock"
      >
        {isOAuthOnly ? (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-4">
            <DynamicIcon
              name="Info"
              size={16}
              className="text-blue-500 mt-0.5 shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Google account detected
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                You signed in with Google. Password management is handled by
                your Google account.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <PasswordInput
              label="Current Password"
              name="currentPassword"
              showKey="current"
              value={form.currentPassword} // ← pass value explicitly
              show={show.current} // ← pass just the boolean
              onToggleShow={() =>
                setShow((s) => ({ ...s, current: !s.current }))
              }
              onChange={handleChange} // ← pass directly, no arrow wrapper
              placeholder="Enter current password"
            />
            <PasswordInput
              label="New Password"
              name="newPassword"
              showKey="new"
              value={form.newPassword}
              show={show.new}
              onToggleShow={() => setShow((s) => ({ ...s, new: !s.new }))}
              onChange={handleChange}
              placeholder="At least 8 characters"
            />
            {/* Strength bar */}
            {form.newPassword && (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{strength.label}</p>
              </div>
            )}

            <PasswordInput
              label="Confirm New Password"
              name="confirmPassword"
              showKey="confirm"
              value={form.confirmPassword}
              show={show.confirm}
              onToggleShow={() =>
                setShow((s) => ({ ...s, confirm: !s.confirm }))
              }
              onChange={handleChange}
              placeholder="Re-enter new password"
            />

            {form.confirmPassword &&
              form.newPassword !== form.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <DynamicIcon name="AlertCircle" size={12} />
                  Passwords do not match
                </p>
              )}

            <div className="flex justify-end mt-2">
              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  !form.currentPassword ||
                  !form.newPassword ||
                  !form.confirmPassword
                }
                className={`flex items-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer`}
              >
                {saving ? (
                  <DynamicIcon
                    name="Loader2"
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <DynamicIcon name="ShieldCheck" size={15} />
                )}
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Danger zone */}
      <SectionCard
        title="Danger Zone"
        subtitle="Irreversible account actions"
        icon="AlertTriangle"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-gray-800">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete your account and all associated data. This
              cannot be undone.
            </p>
          </div>
          <button className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer">
            <DynamicIcon name="Trash2" size={14} />
            Delete Account
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

export default SecurityTab;
