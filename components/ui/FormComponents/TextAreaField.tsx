import { forwardRef, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, className, ...props }, ref) => {
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

        <textarea
          ref={ref}
          {...props}
          className={clsx(
            "w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition focus:ring-1 focus:ring-brand-color-500 focus:border-brand-color-500/80 resize-none",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

TextareaField.displayName = "TextareaField";