"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "../component/SectionCard";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { InputField } from "@/components/ui/InputField";
import { authClient } from "@/lib/auth-client";

interface PersonalForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// ─── Tab: Personal Info ───────────────────────────────────────────────────────

const PersonalTab = () => {
  const { data: session } = authClient.useSession();

  const [form, setForm] = useState<PersonalForm>({
    firstName: session?.user?.firstName ?? "",
    lastName: session?.user?.lastName ?? "",
    email: session?.user?.email ?? "",
    phone: session?.user?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authClient.updateUser({
        firstName: form.firstName,
        lastName: form.lastName,
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() ||
    session?.user?.name?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <SectionCard
        title="Profile Photo"
        subtitle="Update your profile picture"
        icon="Camera"
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-color-100 flex items-center justify-center border-2 border-brand-color-200">
                <span className={`text-2xl font-bold text-brand-color-500`}>
                  {initials}
                </span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-brand-color-500 hover:bg-brand-color-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-md cursor-pointer"
            >
              {uploadingAvatar ? (
                <DynamicIcon
                  name="Loader2"
                  size={12}
                  className="animate-spin"
                />
              ) : (
                <DynamicIcon name="Pencil" size={12} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {session?.user?.name || "Your Name"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {session?.user?.email}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG or GIF · Max 2MB
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Basic Info */}
      <SectionCard
        title="Basic Information"
        subtitle="Your personal details"
        icon="User"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="Juan"
            leftIcon={<DynamicIcon name="User" />}
            required
          />
          <InputField
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="dela Cruz"
            leftIcon={<DynamicIcon name="User" />}
            required
          />
          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="juan@example.com"
            leftIcon={<DynamicIcon name="Mail" />}
            disabled
          />
          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+63 9XX XXX XXXX"
            leftIcon={<DynamicIcon name="Phone" />}
          />
        </div>

        {/* Email notice */}
        <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <DynamicIcon
            name="Info"
            size={14}
            className="text-amber-500 mt-0.5 shrink-0"
          />
          <p className="text-xs text-amber-700">
            Email address cannot be changed here. Contact support if you need to
            update it.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 bg-brand-color-500 hover:bg-brand-color-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer`}
          >
            {saving ? (
              <DynamicIcon name="Loader2" size={15} className="animate-spin" />
            ) : (
              <DynamicIcon name="Save" size={15} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

export default PersonalTab;
