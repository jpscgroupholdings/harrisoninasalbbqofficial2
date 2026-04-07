"use client";

import React, { forwardRef, SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  errors?: string;
  options: SelectOption[];
  leftIcon?: React.ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, errors, options, leftIcon, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-semibold text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            {...props}
            className={clsx(
              "w-full py-3 border border-gray-300 rounded-lg outline-none transition focus:ring-1 focus:ring-brand-color-500 focus:border-brand-color-500/80 bg-white appearance-none cursor-pointer",
              leftIcon ? "pl-10" : "pl-4",
              "pr-10", // space for chevron
              errors && "border-red-500 focus:ring-red-500",
              className
            )}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {errors && <p className="text-sm text-red-500">{errors}</p>}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";