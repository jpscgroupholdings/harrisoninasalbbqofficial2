import { cn } from "@/lib/utils";
import React, { ComponentPropsWithoutRef } from "react";
import { DynamicIcon } from "../DynamicIcon";

type IconPosition = "left" | "right";

interface IconButtonProps extends ComponentPropsWithoutRef<"button"> {
  icon?: {
    name: string;
    size?: number;
    className?: string;
    position?: IconPosition; // default "left"
  };
  text?: string;
  title?: string; // used as tooltip content, not native title attribute
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "disabled";
  isLoading?: boolean;
  children?: React.ReactNode; // if provided, overrides text/icon layout entirely
}

// Shared disabled styling used by most variants
const DEFAULT_DISABLED =
  "disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-100";

const variantClasses: Record<
  NonNullable<IconButtonProps["variant"]>,
  string
> = {
  primary: cn(
    "bg-brand-color-500 hover:bg-brand-color-600 text-white",
    DEFAULT_DISABLED,
  ),
  secondary: cn(
    "bg-gray-100 hover:bg-gray-200 text-gray-800",
    DEFAULT_DISABLED,
  ),
  outline: cn(
    "border border-gray-300 hover:bg-gray-50 text-gray-700",
    DEFAULT_DISABLED,
  ),
  ghost: cn("hover:bg-gray-100 text-gray-700", DEFAULT_DISABLED),
  danger: cn(
    "bg-red-500 hover:bg-red-600 text-white",
    "disabled:bg-red-200 disabled:cursor-not-allowed",
  ),
  // success intentionally does NOT use DEFAULT_DISABLED — it stays green when disabled
  success:
    "bg-green-500 text-white disabled:bg-green-500 disabled:text-white disabled:opacity-100 disabled:cursor-default",
  disabled: DEFAULT_DISABLED,
};

const IconButton = ({
  icon,
  text,
  title,
  className,
  type = "button",
  variant = "primary",
  isLoading = false,
  disabled,
  children,
  ...props
}: IconButtonProps) => {
  const iconPosition = icon?.position ?? "left";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold transition-all cursor-pointer",
        variantClasses[variant],
        className,
      )}
      data-tooltip-id={title ? "app-tooltip" : undefined}
      data-tooltip-content={title}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          {isLoading && (
            <DynamicIcon
              name="Loader2"
              size={icon?.size ?? 16}
              className="animate-spin"
            />
          )}
          {!isLoading && icon && iconPosition === "left" && (
            <DynamicIcon
              name={icon.name}
              size={icon.size ?? 16}
              className={icon.className}
            />
          )}
          {text && <span>{text}</span>}
          {!isLoading && icon && iconPosition === "right" && (
            <DynamicIcon
              name={icon.name}
              size={icon.size ?? 16}
              className={icon.className}
            />
          )}
        </>
      )}
    </button>
  );
};

export default IconButton;
