"use client";

import { InputField } from "@/components/ui/InputField";
import React, { useEffect, useReducer } from "react";
import SectionHeader from "../../components/SectionHeader";
import {
  useSettings,
  useSaveSettings,
  type Days,
  type SettingsType,
} from "@/hooks/api/useSettings";
import LoadingPage from "@/components/ui/LoadingPage";
import { TextareaField } from "@/components/ui/TextAreaField";
import { formatTime } from "@/helper/formatTime";
import { formatDays } from "@/helper/formatDays";

type Action =
  | { type: "SET_STORE_NAME"; value: string }
  | { type: "SET_ADDRESS"; value: string }
  | { type: "SET_CONTACT_FIELD"; field: "phone" | "email" | "viber"; value: string }
  | { type: "TOGGLE_DAY"; day: Days }
  | { type: "SET_HOURS_FIELD"; field: "openTime" | "closeTime"; value: string }
  | { type: "SET_IS_CLOSED"; value: boolean }
  | { type: "LOAD_SETTINGS"; payload: SettingsType }
  | { type: "RESET" };

const DEFAULT_STATE: SettingsType = {
  storeName: "",
  address: "",
  contact: { phone: "", email: "", viber: "" },
  operatingHours: {
    days: [],
    openTime: "",
    closeTime: "",
    isClosed: false,
  },
};

function settingsReducer(state: SettingsType, action: Action): SettingsType {
  switch (action.type) {
    case "SET_STORE_NAME":
      return { ...state, storeName: action.value };

    case "SET_ADDRESS":
      return { ...state, address: action.value };

    case "SET_CONTACT_FIELD":
      return {
        ...state,
        contact: { ...state.contact, [action.field]: action.value },
      };

    case "TOGGLE_DAY": {
      const exists = state.operatingHours.days.includes(action.day);
      return {
        ...state,
        operatingHours: {
          ...state.operatingHours,
          days: exists
            ? state.operatingHours.days.filter((d) => d !== action.day)
            : [...state.operatingHours.days, action.day],
        },
      };
    }

    case "SET_HOURS_FIELD":
      return {
        ...state,
        operatingHours: {
          ...state.operatingHours,
          [action.field]: action.value,
        },
      };

    case "SET_IS_CLOSED":
      return {
        ...state,
        operatingHours: {
          ...state.operatingHours,
          isClosed: action.value,
        },
      };

    case "LOAD_SETTINGS":
      return action.payload;

    case "RESET":
      return DEFAULT_STATE;

    default:
      return state;
  }
}

export const DAYS: Days[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function normalizeForCompare(s: SettingsType) {
  return {
    ...s,
    operatingHours: {
      ...s.operatingHours,
      days: [...s.operatingHours.days].sort(),
    },
  };
}

const SettingsPage = () => {
  const { data: savedSettings, isLoading } = useSettings();
  const { mutate: saveSettings, isPending } = useSaveSettings();
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_STATE);

  useEffect(() => {
    if (savedSettings) {
      dispatch({ type: "LOAD_SETTINGS", payload: savedSettings });
    }
  }, [savedSettings]);

  const hasChanges =
    JSON.stringify(normalizeForCompare(settings)) !==
    JSON.stringify(normalizeForCompare(savedSettings ?? DEFAULT_STATE));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
  };

  const handleReset = () => {
    if (savedSettings) {
      dispatch({ type: "LOAD_SETTINGS", payload: savedSettings });
    } else {
      dispatch({ type: "RESET" });
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader
          title="System Settings"
          subTitle="Manage your system settings"
        />
        <LoadingPage />
      </section>
    );
  }

  const { days, openTime, closeTime, isClosed } = settings.operatingHours;

  const sharedFieldClass = `
    transition-all duration-200
    bg-white
    border border-gray-200
    hover:border-brand-color-300
    focus-within:border-brand-color-500
    focus-within:ring-2 focus-within:ring-brand-color-100
    rounded-xl
  `;

  const sharedReadonlyClass = !hasChanges
    ? "bg-gray-50 text-stone-500"
    : "bg-white text-stone-900";

  const fieldClassName = `${sharedFieldClass} ${sharedReadonlyClass}`;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="System Settings"
        subTitle="Manage your system settings"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-stone-800">Store Information</h2>

        <div className="p-6 border border-gray-200 rounded-xl shadow space-y-4">
          <InputField
            label="Store Name"
            id="store-name"
            type="text"
            value={settings.storeName ?? ""}
            onChange={(e) =>
              dispatch({ type: "SET_STORE_NAME", value: e.target.value })
            }
            required
            className={fieldClassName}
          />

          <div className="border-b border-b-gray-200 pb-4">
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Address
            </label>
            <TextareaField
              value={settings.address}
              onChange={(e) =>
                dispatch({ type: "SET_ADDRESS", value: e.target.value })
              }
              rows={3}
              required
              className={fieldClassName}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Contact Number"
              id="contact-number"
              value={settings.contact.phone}
              onChange={(e) =>
                dispatch({
                  type: "SET_CONTACT_FIELD",
                  field: "phone",
                  value: e.target.value,
                })
              }
              required
              className={fieldClassName}
            />

            <InputField
              label="Email Address"
              id="email-address"
              type="email"
              value={settings.contact.email}
              onChange={(e) =>
                dispatch({
                  type: "SET_CONTACT_FIELD",
                  field: "email",
                  value: e.target.value,
                })
              }
              required
              className={fieldClassName}
            />
          </div>

          <InputField
            label="Viber Number"
            id="viber-number"
            value={settings.contact.viber}
            onChange={(e) =>
              dispatch({
                type: "SET_CONTACT_FIELD",
                field: "viber",
                value: e.target.value,
              })
            }
            required
            className={fieldClassName}
          />
        </div>

        <h2 className="text-xl font-bold text-stone-800">Business Hours</h2>

        <div className="p-6 border border-gray-200 rounded-xl shadow space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-700">Open Days</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const isActive = days.includes(day);

                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => dispatch({ type: "TOGGLE_DAY", day })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-brand-color-500 text-white border-brand-color-500"
                        : "border-gray-200 text-stone-600 hover:border-brand-color-300 hover:bg-gray-50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-stone-400">
              Click to toggle. Selected days share the same opening and closing
              times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Opening Time"
              id="opening-time"
              type="time"
              value={openTime ?? ""}
              disabled={isClosed}
              onChange={(e) =>
                dispatch({
                  type: "SET_HOURS_FIELD",
                  field: "openTime",
                  value: e.target.value,
                })
              }
              className={fieldClassName}
            />

            <InputField
              label="Closing Time"
              id="closing-time"
              type="time"
              value={closeTime ?? ""}
              disabled={isClosed}
              onChange={(e) =>
                dispatch({
                  type: "SET_HOURS_FIELD",
                  field: "closeTime",
                  value: e.target.value,
                })
              }
              className={fieldClassName}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(e) =>
                dispatch({ type: "SET_IS_CLOSED", value: e.target.checked })
              }
              className="w-4 h-4 accent-brand-color-500"
            />
            <span className="text-sm font-medium text-stone-600">
              Mark store as temporarily closed
            </span>
          </label>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Preview
            </p>

            {isClosed ? (
              <p className="text-sm font-semibold text-red-500">
                Store is temporarily closed
              </p>
            ) : (
              <p className="text-sm text-stone-700">
                <span className="font-semibold">{formatDays(days)}</span>
                {days.length > 0 && openTime && closeTime && (
                  <span className="text-stone-500">
                    {" "}
                    · {formatTime(openTime)} – {formatTime(closeTime)}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges}
            className={`px-8 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-colors ${
              !hasChanges && "opacity-40 pointer-events-none"
            }`}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={isPending || !hasChanges}
            className={`flex-1 px-8 py-3 rounded-xl bg-brand-color-500 text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none ${
              !hasChanges && "opacity-40 cursor-not-allowed"
            }`}
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SettingsPage;