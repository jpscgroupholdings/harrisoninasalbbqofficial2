"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode; // 🔥 NEW
  subLabel?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    { label, error, leftIcon, rightElement, className, subLabel, ...props },
    ref,
  ) => {
    return (
      <div className="w-full space-y-2">
        <div className="m-0">
          {label && (
            <label
              htmlFor={props.id}
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {subLabel && (
            <label
              htmlFor={props.id}
              className="block text-xs text-gray-600 mb-2"
            >
              {subLabel}
            </label>
          )}
        </div>

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            {...props}
            className={twMerge(
              "w-full py-3 border border-gray-300 rounded-lg outline-none transition focus:ring-1 focus:ring-brand-color-500 focus:border-brand-color-500/80 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400",
              leftIcon ? "pl-10" : "pl-4",
              rightElement ? "pr-12" : "pr-4", // 🔥 dynamic padding
              error && "border-red-500 focus:ring-red-500",
              className,
            )}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputField.displayName = "InputField";
