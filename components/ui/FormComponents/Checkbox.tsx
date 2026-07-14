"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  subLabel?: React.ReactNode;
  error?: string;
  indeterminate?: boolean; // for "select all" style checkboxes
  leftElement?: React.ReactNode; // e.g. product image, folder icon
  rightElement?: React.ReactNode; // e.g. price, badge
  wrapperClassName?: string; // classes for the outer <label>
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      subLabel,
      error,
      indeterminate = false,
      leftElement,
      rightElement,
      className,
      wrapperClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <label
        htmlFor={props.id}
        className={twMerge(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition cursor-pointer",
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-gray-50",
          wrapperClassName,
        )}
      >
        <input
          ref={innerRef}
          type="checkbox"
          disabled={disabled}
          {...props}
          className={twMerge(
            "w-4 h-4 rounded border-gray-300 text-brand-color-500 focus:ring-brand-color-500/30 cursor-pointer accent-[#e13500] disabled:cursor-not-allowed",
            error && "border-red-500",
            className,
          )}
        />

        {leftElement}

        {(label || subLabel) && (
          <div className="flex-1 min-w-0">
            {label && (
              <span className="block text-sm text-gray-800 truncate">
                {label}
              </span>
            )}
            {subLabel && (
              <span className="block text-xs text-gray-500 truncate">
                {subLabel}
              </span>
            )}
          </div>
        )}

        {rightElement}

        {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";